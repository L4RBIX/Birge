// ============================================================
// Birge — Level 2 Telecom Identity Layer
// Trust engine — CLIENT-SAFE (pure functions, no server imports)
// ============================================================

import type { TelecomIdentityResult, TrustDecision } from "./types";

// ────────────────────────────────────────────────────────────
// Trust copy exports (exact display strings)
// ────────────────────────────────────────────────────────────

/** Displayed when a real SMS OTP was approved by the provider. */
export const TRUST_COPY_OTP_VERIFIED =
  "Phone number verified by live SMS OTP.";

/**
 * Displayed when the SIM/eSIM silent Network API is production-ready
 * but operator credentials are not yet configured.
 */
export const TRUST_COPY_NETWORK_API_NOT_CONFIGURED =
  "Silent SIM/eSIM verification is production-ready but waiting for operator credentials.";

// ────────────────────────────────────────────────────────────
// OTP context type (optional second param)
// ────────────────────────────────────────────────────────────

export interface OtpVerificationContext {
  /** Whether the OTP check was approved (any provider, including mock) */
  verified: boolean;
  /** Whether the verification was done by a real (non-mock) provider */
  realVerification: boolean;
}

/**
 * Calculate a commerce trust score (0-100) and a decision
 * based on the telecom identity verification result.
 *
 * Scoring table (verification paths are non-stacking — take the max bonus):
 *   realNetworkCheck && status === "verified"  → +50 (network API path)
 *   real SMS OTP approved (realVerification)   → +35 (OTP path)
 *   dev-mode OTP code (mock, !realVerification) → +15, labeled "dev-mode"
 *   dev-mode network verification (!realNetworkCheck) → +25, labeled
 *   numberVerified                             → +20
 *   deviceBound                                → +10
 *   simSwapRisk === "low"                      → +20
 *   simSwapRisk === "medium"                   → decision "step_up"
 *   simSwapRisk === "high"                     → decision "block"
 *   status === "risk_blocked"                  → decision "block"
 *   status === "not_configured"                → allow (demo) labeled
 *
 * When both network API and OTP paths are present, only the higher bonus
 * is counted (no double-stacking).
 *
 * Final score is clamped to [0, 100].
 */
export function calculateCommerceTrustScore(
  result: TelecomIdentityResult,
  otp?: OtpVerificationContext
): TrustDecision {
  const reasons: string[] = [];
  let score = 0;
  let decision: "allow" | "step_up" | "block" = "allow";

  // Hard blocks first
  if (result.status === "risk_blocked") {
    return {
      trustScore: 0,
      decision: "block",
      reasons: ["Верификация заблокирована: высокий риск (risk_blocked)."],
    };
  }

  if (result.simSwapRisk === "high") {
    return {
      trustScore: 0,
      decision: "block",
      reasons: [
        "Обнаружена смена SIM-карты. Активные сделки заморожены до повторной верификации.",
      ],
    };
  }

  // Not configured → allow in demo mode with clear label
  if (result.status === "not_configured") {
    return {
      trustScore: 30,
      decision: "allow",
      reasons: [
        "Dev-mode: провайдер телеком не настроен. Доступ разрешён только в режиме демо.",
      ],
    };
  }

  // ── Verification path bonuses (non-stacking — take the maximum) ──
  //
  // Network API path: realNetworkCheck verified → +50
  // OTP real path:    realVerification approved  → +35
  // OTP dev-mode:     mock approved              → +15
  // Network dev-mode: !realNetworkCheck verified → +25
  //
  // We collect candidate bonuses and apply the largest only.

  let networkApiBonus = 0;
  let networkApiReason = "";

  let otpBonus = 0;
  let otpReason = "";

  if (result.realNetworkCheck && result.status === "verified") {
    networkApiBonus = 50;
    networkApiReason = "Реальная проверка через сеть оператора подтверждена (+50).";
  } else if (!result.realNetworkCheck && result.status === "verified") {
    networkApiBonus = 25;
    networkApiReason =
      "Dev-mode верификация (не реальная проверка сети) (+25). Для продакшена нужны учётные данные оператора.";
  }

  if (otp?.verified) {
    if (otp.realVerification) {
      otpBonus = 35;
      otpReason = "Номер телефона верифицирован через живой SMS OTP (+35).";
    } else {
      // Dev-mode mock code
      otpBonus = 15;
      otpReason =
        "Dev-mode: OTP-код принят в режиме разработки (не реальная верификация) (+15).";
    }
  }

  // Apply the higher of the two bonuses (no stacking)
  if (networkApiBonus >= otpBonus && networkApiBonus > 0) {
    score += networkApiBonus;
    reasons.push(networkApiReason);
  } else if (otpBonus > 0) {
    score += otpBonus;
    reasons.push(otpReason);
  }

  // Number verified
  if (result.numberVerified) {
    score += 20;
    reasons.push("Номер телефона верифицирован (+20).");
  }

  // Device bound
  if (result.deviceBound) {
    score += 10;
    reasons.push("Устройство привязано к аккаунту (+10).");
  }

  // SIM swap risk
  if (result.simSwapRisk === "low") {
    score += 20;
    reasons.push("Риск смены SIM низкий (+20).");
  } else if (result.simSwapRisk === "medium") {
    decision = "step_up";
    reasons.push(
      "Средний риск смены SIM: требуется дополнительная проверка (step_up)."
    );
  }
  // "high" is handled above; "unknown" → no bonus, no block

  // Clamp score to [0, 100]
  const trustScore = Math.max(0, Math.min(100, score));

  return { trustScore, decision, reasons };
}

/**
 * Returns a human-readable (Russian, judge-friendly) explanation of the
 * trust decision.  Suitable for display in the UI or demo pitch.
 */
export function explainTrustDecision(
  result: TelecomIdentityResult,
  score: TrustDecision
): string[] {
  const lines: string[] = [];

  lines.push(`Провайдер: ${result.provider}`);
  lines.push(`Статус верификации: ${result.status}`);
  lines.push(`Балл доверия: ${score.trustScore} / 100`);
  lines.push(
    `Решение: ${
      score.decision === "allow"
        ? "Разрешено"
        : score.decision === "step_up"
          ? "Требует дополнительной проверки"
          : "Заблокировано"
    }`
  );

  if (result.realNetworkCheck) {
    lines.push("Реальная проверка оператора: ДА");
  } else {
    lines.push(
      "Реальная проверка оператора: НЕТ (dev-mode или ошибка запроса)"
    );
  }

  if (result.simSwapDetected) {
    lines.push(
      "ВНИМАНИЕ: Обнаружена смена SIM-карты. Сделки заморожены до повторной верификации."
    );
  }

  lines.push(...score.reasons);

  return lines;
}
