"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BUDGET_PRESETS,
  KZ_CITIES,
  formatBudgetLabel,
  formatKztNumber,
  parseBudgetInput,
  type StoredBirgeProfile,
} from "@/lib/kz-options";
import { getOrCreateDeviceId } from "@/lib/telecom/device";

// ─── OTP API response types (client-side shapes) ──────────────────────────────

interface OtpStartResponse {
  status: "sent" | "not_configured" | "failed" | "rate_limited";
  provider: "mock" | "twilio" | "vonage" | "custom";
  realSmsSent: boolean;
  configured: boolean;
  requestId?: string;
  message: string;
}

interface OtpCheckIdentity {
  status: string;
  provider: string;
  verificationType: "sms_otp" | "dev_mode";
  phoneVerified: boolean;
  realSmsSent: boolean;
  realVerification: boolean;
  realNetworkCheck: false;
  configured: boolean;
  simSwapRisk: "low" | "medium" | "high" | "unknown";
  checkedAt: string;
  phoneMasked: string | null;
}

interface OtpCheckTrust {
  trustScore: number;
  decision: "allow" | "step_up" | "block";
  reasons: string[];
}

interface OtpCheckResponse {
  status: "approved" | "invalid" | "expired" | "pending" | "not_configured" | "failed";
  provider: "mock" | "twilio" | "vonage" | "custom";
  phoneVerified: boolean;
  realVerification: boolean;
  configured: boolean;
  message: string;
  identity?: OtpCheckIdentity;
  trust?: OtpCheckTrust;
}

// ─── localStorage shape (contract shared with JoinDealSheet + TelecomProfileCard) ─

interface StoredTelecomIdentity {
  // Core shape (pre-existing, read by TelecomProfileCard / JoinDealSheet)
  status: string;
  provider: string;
  realNetworkCheck: false; // always false for OTP — SIM/eSIM Network API is Level 2
  configured: boolean;
  trustScore: number;
  decision: "allow" | "step_up" | "block";
  simSwapRisk: "low" | "medium" | "high" | "unknown";
  checkedAt: string;
  phoneMasked: string | null;
  // OTP-extended fields
  verificationType: "sms_otp" | "dev_mode";
  realSmsSent: boolean;
  realVerification: boolean;
  phoneVerified: boolean;
}

// ─── Step machine ──────────────────────────────────────────────────────────────

type Step = "phone" | "code" | "result" | "profile";

const STEPS: Step[] = ["phone", "code", "result", "profile"];

function stepProgress(step: Step): number {
  return ((STEPS.indexOf(step) + 1) / STEPS.length) * 100;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidKzPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+7|8)\d{10}$/.test(cleaned);
}

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return cleaned.replace(/^8(\d{10})$/, "+7$1");
}

function capitalizeProvider(provider: string): string {
  const map: Record<string, string> = {
    twilio: "Twilio",
    vonage: "Vonage",
    custom: "Custom",
    mock: "Mock",
  };
  return map[provider.toLowerCase()] ?? provider;
}

function persistTelecomIdentity(
  checkResp: OtpCheckResponse,
  startResp: OtpStartResponse
): void {
  try {
    const identity = checkResp.identity;
    const trust = checkResp.trust;
    const payload: StoredTelecomIdentity = {
      status: checkResp.status,
      provider: checkResp.provider,
      realNetworkCheck: false,
      configured: checkResp.configured,
      trustScore: trust?.trustScore ?? 0,
      decision: trust?.decision ?? "allow",
      simSwapRisk: identity?.simSwapRisk ?? "unknown",
      checkedAt: identity?.checkedAt ?? new Date().toISOString(),
      phoneMasked: identity?.phoneMasked ?? null,
      // OTP extensions
      verificationType: checkResp.realVerification ? "sms_otp" : "dev_mode",
      realSmsSent: startResp.realSmsSent,
      realVerification: checkResp.realVerification,
      phoneVerified: checkResp.phoneVerified,
    };
    localStorage.setItem("birge_telecom_identity", JSON.stringify(payload));
  } catch {
    // localStorage blocked — silently ignore
  }
}

function persistBirgeProfile(profile: StoredBirgeProfile): void {
  try {
    localStorage.setItem("birge_profile", JSON.stringify(profile));
  } catch {
    // localStorage blocked — user can still continue through the demo flow
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultBadge({
  label,
  variant,
}: {
  label: string;
  variant: "green" | "amber" | "neutral";
}) {
  const cls =
    variant === "green"
      ? "border-[#007f67] text-[#007f67]"
      : variant === "amber"
        ? "border-[#b45309] text-[#b45309] bg-[#fffbeb]"
        : "border-[rgb(34,34,34)] text-[rgb(34,34,34)]";
  return (
    <span
      className={`inline-flex h-[30px] items-center border px-[10px] text-[12px] font-bold ${cls}`}
    >
      {label}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Женский");
  const [city, setCity] = useState<(typeof KZ_CITIES)[number]>("Алматы");
  const [budgetBand, setBudgetBand] = useState<(typeof BUDGET_PRESETS)[number]>(
    "10 000–50 000 ₸"
  );
  const [budgetMinInput, setBudgetMinInput] = useState("");
  const [budgetMaxInput, setBudgetMaxInput] = useState("");

  // OTP start state
  const [startResp, setStartResp] = useState<OtpStartResponse | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [startLoading, setStartLoading] = useState(false);

  // OTP check state
  const [code, setCode] = useState("");
  const [checkResp, setCheckResp] = useState<OtpCheckResponse | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  // Device ID acquired at flow start (when we first call start)
  const deviceIdRef = useRef<string | null>(null);

  // Auto-focus code input when entering code step
  const codeInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (step === "code") {
      codeInputRef.current?.focus();
    }
  }, [step]);

  // ── OTP start handler ──────────────────────────────────────────────────────

  async function handleSendCode() {
    if (!isValidKzPhone(phone) || !consent) return;

    const normalized = normalizePhone(phone);
    deviceIdRef.current = getOrCreateDeviceId();

    setStartError(null);
    setStartLoading(true);

    try {
      const res = await fetch("/api/telecom/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: normalized, consentGiven: true }),
      });

      // 429 rate limit
      if (res.status === 429) {
        setStartError("Слишком много попыток. Подождите 10 минут.");
        setStartLoading(false);
        return;
      }

      const data = (await res.json()) as OtpStartResponse;

      if (data.status === "rate_limited") {
        setStartError("Слишком много попыток. Подождите 10 минут.");
        setStartLoading(false);
        return;
      }

      if (data.status === "failed") {
        // not_configured (mock / dev-mode) is allowed to proceed — only a hard failure blocks
        setStartError(data.message || "Не удалось отправить код. Попробуйте ещё раз.");
        setStartLoading(false);
        return;
      }

      setStartResp(data);
      setCode("");
      setCodeError(null);
      setStep("code");
    } catch {
      setStartError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setStartLoading(false);
    }
  }

  // ── OTP check handler ──────────────────────────────────────────────────────

  async function handleVerifyCode() {
    if (code.length !== 6 || !startResp) return;

    const normalized = normalizePhone(phone);
    setCodeError(null);
    setCheckLoading(true);

    try {
      const body: Record<string, string> = {
        phoneNumber: normalized,
        code,
      };
      if (startResp.requestId) {
        body.requestId = startResp.requestId;
      }

      const res = await fetch("/api/telecom/otp/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as OtpCheckResponse;

      if (data.status === "invalid") {
        setCodeError("Неверный код. Попробуйте ещё раз.");
        setCode("");
        setCheckLoading(false);
        codeInputRef.current?.focus();
        return;
      }

      if (data.status === "expired") {
        setCodeError("Код истёк. Запросите новый.");
        setCode("");
        setCheckLoading(false);
        return;
      }

      if (data.status === "approved") {
        persistTelecomIdentity(data, startResp);
        setCheckResp(data);
        setStep("result");
        return;
      }

      // failed / not_configured / pending
      setCodeError(data.message || "Не удалось подтвердить код.");
    } catch {
      setCodeError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setCheckLoading(false);
    }
  }

  // ── Resend handler ─────────────────────────────────────────────────────────

  async function handleResend() {
    setCodeError(null);
    setCode("");
    setStartError(null);
    await handleSendCode();
  }

  function handleSaveProfile() {
    const budgetMin = parseBudgetInput(budgetMinInput);
    const budgetMax = parseBudgetInput(budgetMaxInput);
    const budgetLabel = formatBudgetLabel({
      budgetBand,
      budgetMin,
      budgetMax,
    });

    persistBirgeProfile({
      name: name.trim() || "Айгерим",
      age: age.trim() || undefined,
      gender,
      city,
      budgetBand: budgetLabel,
      budgetMin,
      budgetMax,
    });
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  const phoneValid = isValidKzPhone(phone);
  const canSend = phoneValid && consent && !startLoading;

  return (
    <main className="min-h-dvh bg-white px-[24px] py-[32px] text-[rgb(34,34,34)]">
      <section className="mx-auto max-w-[520px]">
        <Link href="/" className="text-[24px] leading-none font-bold tracking-[0.18em]">
          BIRGE
        </Link>

        <div className="mt-[40px]">
          <p className="text-[13px] leading-[17px] font-bold text-[#007f67]">
            Сначала trust layer
          </p>
          <h1 className="mt-[8px] text-[34px] leading-[40px] font-normal">
            Регистрация в Birge
          </h1>
          <p className="mt-[12px] text-[15px] leading-5 text-ff-gray-text">
            Войдите через номер телефона. SMS OTP подтвердит, что это реальный пользователь.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-[24px] h-[3px] bg-[rgb(230,230,230)]">
          <div
            className="h-full bg-[#00a884] transition-all duration-300"
            style={{ width: `${stepProgress(step)}%` }}
          />
        </div>

        {/* ── Step: phone ────────────────────────────────────────────────── */}
        {step === "phone" && (
          <div className="mt-[28px]">
            <label className="block text-[13px] leading-[17px] font-bold">
              Номер телефона
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="+7 ___ ___ __ __"
                className="mt-[8px] h-[50px] w-full border border-[rgb(34,34,34)] px-[14px] text-[16px] outline-none"
              />
            </label>

            {/* Consent checkbox */}
            <label className="mt-[16px] flex cursor-pointer items-start gap-[10px]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-[3px] h-[16px] w-[16px] shrink-0 accent-[rgb(34,34,34)]"
              />
              <span className="text-[13px] leading-[18px] text-ff-gray-text">
                Я согласен на проверку номера для защиты групповых покупок.
              </span>
            </label>

            {startError && (
              <div className="mt-[16px] border border-[rgb(200,50,50)] px-[14px] py-[12px]">
                <p className="text-[13px] leading-5 text-[rgb(180,30,30)]">{startError}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSendCode}
              disabled={!canSend}
              className="mt-[20px] flex h-[50px] w-full items-center justify-center bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white disabled:opacity-50"
            >
              {startLoading ? "Отправка…" : "Получить код"}
            </button>
          </div>
        )}

        {/* ── Step: code ─────────────────────────────────────────────────── */}
        {step === "code" && startResp && (
          <div className="mt-[28px]">
            {/* Delivery status panel */}
            {startResp.realSmsSent ? (
              /* Real provider sent a live SMS */
              <div className="border border-[#007f67] bg-white px-[16px] py-[14px]">
                <p className="text-[15px] leading-[22px] font-bold text-[#007f67]">
                  Код отправлен на ваш номер
                </p>
                <p className="mt-[4px] text-[13px] leading-[18px] text-[rgb(34,34,34)]">
                  Live SMS verification · provider: {capitalizeProvider(startResp.provider)}
                </p>
              </div>
            ) : (
              /* Mock / dev-mode — amber panel, not green, not "live" */
              <div className="border border-[rgb(200,175,90)] bg-[#fffdf0] px-[16px] py-[14px]">
                <p className="text-[13px] leading-[17px] font-bold text-[rgb(120,90,20)] uppercase tracking-[0.08em]">
                  Dev-mode
                </p>
                <p className="mt-[6px] text-[14px] leading-[20px] text-[rgb(34,34,34)]">
                  {startResp.message || "SMS provider не настроен. Dev-mode: используйте код 000000."}
                </p>
              </div>
            )}

            {/* Code input */}
            <label className="mt-[20px] block text-[13px] leading-[17px] font-bold">
              Введите код
              <input
                ref={codeInputRef}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setCode(val);
                  if (codeError) setCodeError(null);
                }}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="mt-[8px] h-[50px] w-full border border-[rgb(34,34,34)] px-[14px] text-[24px] font-bold tracking-[0.22em] outline-none"
              />
            </label>

            {/* Inline code error */}
            {codeError && (
              <p className="mt-[10px] text-[13px] leading-5 text-[rgb(180,30,30)]">
                {codeError}
              </p>
            )}

            {/* Resend expired offer */}
            {codeError?.includes("истёк") && (
              <button
                type="button"
                onClick={handleResend}
                disabled={startLoading}
                className="mt-[10px] text-[13px] font-bold text-[rgb(34,34,34)] underline underline-offset-2 disabled:opacity-50"
              >
                Запросить новый код
              </button>
            )}

            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={code.length !== 6 || checkLoading}
              className="mt-[20px] flex h-[50px] w-full items-center justify-center bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white disabled:opacity-50"
            >
              {checkLoading ? "Проверка…" : "Подтвердить"}
            </button>

            {/* Resend action */}
            <button
              type="button"
              onClick={handleResend}
              disabled={startLoading}
              className="mt-[14px] flex w-full items-center justify-center text-[13px] leading-5 text-ff-gray-text underline underline-offset-2 disabled:opacity-40"
            >
              {startLoading ? "Отправка…" : "Отправить код ещё раз"}
            </button>

            {/* Back link */}
            <button
              type="button"
              onClick={() => {
                setStartResp(null);
                setStartError(null);
                setCodeError(null);
                setCode("");
                setStep("phone");
              }}
              className="mt-[10px] flex w-full items-center justify-center text-[13px] leading-5 text-ff-gray-text"
            >
              ← Изменить номер
            </button>
          </div>
        )}

        {/* ── Step: result ───────────────────────────────────────────────── */}
        {step === "result" && checkResp && (
          <div className="mt-[28px]">
            {/* Live OTP — real provider + realVerification */}
            {checkResp.realVerification && (
              <div className="border border-[#007f67] p-[18px]">
                <p className="text-[18px] leading-[24px] font-bold text-[#007f67]">
                  ✓ Номер подтверждён через live SMS OTP
                </p>
                <div className="mt-[10px] flex flex-wrap gap-[8px]">
                  <ResultBadge label={capitalizeProvider(checkResp.provider)} variant="green" />
                  <ResultBadge label="realSmsSent: true" variant="green" />
                  <ResultBadge label="realVerification: true" variant="green" />
                  <ResultBadge label="device bound" variant="green" />
                </div>
                {checkResp.trust && (
                  <p className="mt-[12px] text-[14px] leading-5 text-[rgb(34,34,34)]">
                    Trust score:{" "}
                    <strong>{checkResp.trust.trustScore}</strong> ·{" "}
                    {checkResp.trust.decision}
                  </p>
                )}
              </div>
            )}

            {/* Dev-mode — approved but not realVerification */}
            {!checkResp.realVerification && (
              <div className="border border-[rgb(200,175,90)] bg-[#fffdf0] p-[18px]">
                <div className="flex items-center gap-[8px]">
                  <p className="text-[16px] leading-[22px] font-bold text-[rgb(34,34,34)]">
                    Dev-mode verification complete
                  </p>
                  <span className="inline-flex items-center border border-[#b45309] bg-[#fffbeb] px-[8px] py-[2px] text-[11px] font-bold text-[#b45309] uppercase tracking-[0.08em]">
                    Dev
                  </span>
                </div>
                <div className="mt-[10px] flex flex-wrap gap-[8px]">
                  <ResultBadge label={`provider: ${capitalizeProvider(checkResp.provider)}`} variant="amber" />
                  <ResultBadge label="realVerification: false" variant="amber" />
                </div>
                {checkResp.trust && (
                  <p className="mt-[12px] text-[14px] leading-5 text-[rgb(34,34,34)]">
                    Trust score:{" "}
                    <strong>{checkResp.trust.trustScore}</strong> ·{" "}
                    {checkResp.trust.decision}
                  </p>
                )}
              </div>
            )}

            {/* Level 2 explanation panel */}
            <div className="mt-[16px] border border-ff-hairline px-[16px] py-[14px]">
              <p className="text-[13px] leading-[17px] font-bold text-[rgb(34,34,34)]">
                О верификации
              </p>
              <p className="mt-[10px] text-[13px] leading-[20px] text-ff-gray-text">
                Сегодня: live SMS OTP подтверждает номер.
              </p>
              <p className="mt-[6px] text-[13px] leading-[20px] text-ff-gray-text">
                Production Level 2: silent SIM/eSIM Network API подтверждает SIM без SMS-кода.
              </p>
              <p className="mt-[6px] text-[13px] leading-[20px] text-ff-gray-text">
                1 SIM/eSIM identity = 1 trusted group slot.
              </p>
            </div>

            {/* Continue to profile */}
            <button
              type="button"
              onClick={() => setStep("profile")}
              className="mt-[20px] flex h-[50px] w-full items-center justify-center bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white"
            >
              Заполнить профиль
            </button>
          </div>
        )}

        {/* ── Step: profile ──────────────────────────────────────────────── */}
        {step === "profile" && (
          <form className="mt-[28px] space-y-[16px]">
            <label className="block text-[13px] leading-[17px] font-bold">
              Имя
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-[8px] h-[48px] w-full border border-[rgb(34,34,34)] px-[14px] text-[16px] outline-none"
                placeholder="Айгерим"
              />
            </label>
            <div className="grid grid-cols-2 gap-[12px]">
              <label className="block text-[13px] leading-[17px] font-bold">
                Возраст
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="mt-[8px] h-[48px] w-full border border-[rgb(34,34,34)] px-[14px] text-[16px] outline-none"
                  placeholder="24"
                  inputMode="numeric"
                />
              </label>
              <label className="block text-[13px] leading-[17px] font-bold">
                Пол
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-[8px] h-[48px] w-full border border-[rgb(34,34,34)] bg-white px-[14px] text-[16px] outline-none"
                >
                  <option>Женский</option>
                  <option>Мужской</option>
                  <option>Не указывать</option>
                </select>
              </label>
            </div>
            <label className="block text-[13px] leading-[17px] font-bold">
              Город
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as (typeof KZ_CITIES)[number])}
                className="mt-[8px] h-[48px] w-full border border-[rgb(34,34,34)] bg-white px-[14px] text-[16px] outline-none"
              >
                {KZ_CITIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className="space-y-[12px]">
              <label className="block text-[13px] leading-[17px] font-bold">
                Быстрый бюджет
                <select
                  value={budgetBand}
                  onChange={(e) =>
                    setBudgetBand(e.target.value as (typeof BUDGET_PRESETS)[number])
                  }
                  className="mt-[8px] h-[48px] w-full border border-[rgb(34,34,34)] bg-white px-[14px] text-[16px] outline-none"
                >
                  {BUDGET_PRESETS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-[12px] max-[389px]:grid-cols-1">
                <label className="block text-[13px] leading-[17px] font-bold">
                  Бюджет от
                  <div className="mt-[8px] flex h-[48px] items-center border border-[rgb(34,34,34)] bg-white">
                    <input
                      value={budgetMinInput}
                      onChange={(e) =>
                        setBudgetMinInput(e.target.value.replace(/\D/g, ""))
                      }
                      inputMode="numeric"
                      placeholder="10 000"
                      className="min-w-0 flex-1 px-[14px] text-[16px] outline-none"
                    />
                    <span className="shrink-0 pr-[12px] text-[14px] text-ff-gray-text">
                      ₸
                    </span>
                  </div>
                </label>
                <label className="block text-[13px] leading-[17px] font-bold">
                  Бюджет до
                  <div className="mt-[8px] flex h-[48px] items-center border border-[rgb(34,34,34)] bg-white">
                    <input
                      value={budgetMaxInput}
                      onChange={(e) =>
                        setBudgetMaxInput(e.target.value.replace(/\D/g, ""))
                      }
                      inputMode="numeric"
                      placeholder="80 000"
                      className="min-w-0 flex-1 px-[14px] text-[16px] outline-none"
                    />
                    <span className="shrink-0 pr-[12px] text-[14px] text-ff-gray-text">
                      ₸
                    </span>
                  </div>
                </label>
              </div>
              <p className="text-[13px] leading-[18px] text-ff-gray-text">
                Профиль бюджета:{" "}
                <span className="font-bold text-[rgb(34,34,34)]">
                  {formatBudgetLabel({
                    budgetBand,
                    budgetMin: parseBudgetInput(budgetMinInput),
                    budgetMax: parseBudgetInput(budgetMaxInput),
                  })}
                </span>
                {parseBudgetInput(budgetMinInput) ? (
                  <span className="sr-only">
                    Бюджет от {formatKztNumber(parseBudgetInput(budgetMinInput) ?? 0)} ₸
                  </span>
                ) : null}
                {parseBudgetInput(budgetMaxInput) ? (
                  <span className="sr-only">
                    Бюджет до {formatKztNumber(parseBudgetInput(budgetMaxInput) ?? 0)} ₸
                  </span>
                ) : null}
              </p>
            </div>
            <Link
              href="/interests"
              onClick={handleSaveProfile}
              className="flex h-[50px] w-full items-center justify-center bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white"
            >
              Выбрать интересы
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
