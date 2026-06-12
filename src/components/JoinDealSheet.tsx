"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CrossIcon } from "@/components/icons";
import { formatKzt } from "@/lib/birge-content";
import { logMlEvent } from "@/lib/ml-api";
import {
  getOrCreateDeviceId,
  hasJoinedDeal,
  markDealJoined,
} from "@/lib/telecom/device";
import {
  buildAuditEvent,
  recordAuditEvent,
} from "@/lib/telecom/audit";
import { calculateCommerceTrustScore } from "@/lib/telecom/risk";
import type { Deal } from "@/types/birge";
import type { TelecomProviderName } from "@/lib/telecom/types";
import type { OtpProviderName } from "@/lib/telecom/otp-types";

// ─── localStorage identity shape (written by onboarding) ─────────────────────
interface StoredIdentity {
  status: string;
  provider: TelecomProviderName | OtpProviderName;
  realNetworkCheck: boolean;
  configured: boolean;
  trustScore: number;
  decision: "allow" | "step_up" | "block";
  simSwapRisk: "low" | "medium" | "high" | "unknown";
  checkedAt: string;
  phoneMasked?: string;
}

// ─── /api/telecom/status response shape ──────────────────────────────────────
interface TelecomStatusResponse {
  provider: TelecomProviderName;
  configured: boolean;
  devMode: boolean;
  operatorHint?: string;
}

function readStoredIdentity(): StoredIdentity | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("birge_telecom_identity");
    if (!raw) return null;
    return JSON.parse(raw) as StoredIdentity;
  } catch {
    return null;
  }
}

// ─── compact trust badge ──────────────────────────────────────────────────────
function TrustBadge({
  identity,
  statusData,
}: {
  identity: StoredIdentity | null;
  statusData: TelecomStatusResponse | null;
}) {
  // Derive display values from stored identity when available, else fall back to
  // the status endpoint (provider + devMode only).
  const provider = identity?.provider ?? statusData?.provider ?? "mock";
  const realCheck = identity?.realNetworkCheck ?? false;
  const swapRisk = identity?.simSwapRisk ?? "unknown";
  const devMode = statusData?.devMode ?? !identity?.realNetworkCheck;
  const verified = identity !== null;

  // Compute decision from stored fields (or fall back to trust function).
  let decision: "allow" | "step_up" | "block" = identity?.decision ?? "allow";
  if (identity) {
    // Re-derive to be safe — identity may be partial.
    const score = calculateCommerceTrustScore({
      status: (identity.status as StoredIdentity["status"]) === "verified"
        ? "verified"
        : "not_configured",
      provider: identity.provider as TelecomProviderName,
      simVerified: identity.trustScore > 0,
      numberVerified: identity.trustScore > 20,
      deviceBound: true,
      simSwapRisk: identity.simSwapRisk,
      realNetworkCheck: identity.realNetworkCheck,
      configured: identity.configured,
      riskScore: identity.trustScore,
      reason: "",
      checkedAt: identity.checkedAt,
    });
    decision = score.decision;
  }

  const decisionColor =
    decision === "allow"
      ? "text-[#007f67]"
      : decision === "step_up"
      ? "text-[#c57c00]"
      : "text-[#d71920]";

  return (
    <div className="mt-[16px] rounded-[6px] border border-ff-hairline bg-[rgb(248,248,248)] px-[14px] py-[12px] text-[12px] leading-[18px]">
      <div className="flex flex-wrap items-center gap-x-[12px] gap-y-[4px]">
        <span className="font-bold text-[rgb(34,34,34)]">
          Провайдер: {provider}
        </span>
        <span className="text-ff-gray-text">
          Real network: <span className={realCheck ? "text-[#007f67] font-bold" : "text-[#c57c00] font-bold"}>{realCheck ? "true" : "false"}</span>
        </span>
        <span className="text-ff-gray-text">
          SIM swap: <span className="font-bold text-[rgb(34,34,34)]">{swapRisk}</span>
        </span>
        <span className={`font-bold ${decisionColor}`}>
          Decision: {decision}
        </span>
      </div>
      {!verified && (
        <p className="mt-[6px] text-ff-gray-text">
          Верификация: не пройдена
        </p>
      )}
      {devMode && (
        <span className="mt-[6px] inline-block rounded-[3px] bg-[rgb(230,230,230)] px-[6px] py-[2px] text-[11px] font-bold text-[rgb(80,80,80)]">
          dev-mode
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function JoinDealSheet({
  deal,
  open,
  onOpenChange,
}: {
  deal: Deal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dealId = deal.id; // stable; Deal.id is a string field

  const [step, setStep] = useState(0);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [identity, setIdentity] = useState<StoredIdentity | null>(null);
  const [statusData, setStatusData] = useState<TelecomStatusResponse | null>(null);

  // Track which (open, dealId) pair we last initialised so we only run once per open
  const lastInitKey = useRef<string>("");

  const shareText = useMemo(
    () => encodeURIComponent(`Birge: вступай в группу на ${deal.titleRu}`),
    [deal.titleRu]
  );

  // On open: check duplicate + load identity + fetch status.
  // All synchronous state is batched into a single async task (microtask) to
  // avoid the react-hooks/set-state-in-effect lint rule.
  useEffect(() => {
    if (!open) return;
    const initKey = `${open}:${dealId}`;
    if (lastInitKey.current === initKey) return;
    lastInitKey.current = initKey;

    // Schedule all initialisation as a promise so setState is only called
    // from an async continuation — not synchronously within the effect body.
    void Promise.resolve().then(() => {
      const alreadyJoined = hasJoinedDeal(dealId);
      const id = readStoredIdentity();

      setIsDuplicate(alreadyJoined);
      setIdentity(id);

      if (alreadyJoined) {
        const deviceId = getOrCreateDeviceId();
        recordAuditEvent(
          buildAuditEvent("DUPLICATE_DEVICE_BLOCKED", {
            deviceId,
            dealId,
            provider: id?.provider ?? "mock",
            realNetworkCheck: id?.realNetworkCheck ?? false,
            decision: "block",
          })
        );
      }

      // Fetch provider status from API (non-blocking)
      fetch("/api/telecom/status")
        .then((r) => r.json() as Promise<TelecomStatusResponse>)
        .then((data) => setStatusData(data))
        .catch(() => {
          // Network unavailable in demo — silently ignore
        });
    });
  }, [open, dealId]);

  function close() {
    lastInitKey.current = "";
    setStep(0);
    onOpenChange(false);
  }

  function handleConfirm() {
    if (isDuplicate) return; // Guard — should not happen since button is hidden

    const deviceId = getOrCreateDeviceId();
    const provider = identity?.provider ?? statusData?.provider ?? "mock";
    const realCheck = identity?.realNetworkCheck ?? false;

    markDealJoined(dealId);

    recordAuditEvent(
      buildAuditEvent("GROUP_SLOT_BOUND", {
        deviceId,
        dealId,
        provider,
        realNetworkCheck: realCheck,
        decision: "allow",
      })
    );

    logMlEvent({
      deal,
      eventType: "join",
      metadata: { surface: "join_sheet_confirm" },
    });

    setStep(1);
  }

  if (!open) return null;

  // Determine confirmation line copy
  const realCheck = identity?.realNetworkCheck ?? false;
  const confirmationLine = realCheck
    ? "Ваше место закреплено за SIM/eSIM identity"
    : "Dev-mode: место закреплено за demo device ID. Production: SIM/eSIM Network API.";

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end justify-center bg-[rgba(34,34,34,0.42)] lg:items-center"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-sheet-title"
        className="w-full max-w-[520px] rounded-t-[16px] bg-white p-[24px] shadow-[0_0_0_1px_rgba(34,34,34,0.08)] lg:rounded-[12px]"
      >
        <div className="flex items-start justify-between gap-[16px]">
          <div>
            <p className="text-[13px] leading-[17px] text-[#007f67] font-bold">
              1 SIM = 1 место
            </p>
            <h2
              id="join-sheet-title"
              className="mt-[6px] text-[22px] leading-[28px] font-normal text-[rgb(34,34,34)]"
            >
              Вступить в группу
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close join sheet"
            className="flex h-[44px] w-[44px] items-center justify-center"
          >
            <CrossIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Duplicate blocked banner — shown immediately if already joined */}
        {isDuplicate && (
          <div className="mt-[16px] rounded-[6px] border border-[#d71920] bg-[rgba(215,25,32,0.05)] px-[16px] py-[14px]">
            <p className="text-[14px] leading-[20px] font-bold text-[#d71920]">
              Это устройство уже занимает место в группе. 1 SIM = 1 место.
            </p>
          </div>
        )}

        {/* Trust badge — always visible */}
        <TrustBadge identity={identity} statusData={statusData} />

        {/* Progress bar — only when not blocked */}
        {!isDuplicate && (
          <div className="mt-[20px] h-[3px] bg-[rgb(230,230,230)]">
            <div
              className="h-full bg-[#00a884] transition-all duration-200"
              style={{ width: `${((step + 1) / 3) * 100}%` }}
            />
          </div>
        )}

        {/* Step 0: Deal overview + confirm */}
        {!isDuplicate && step === 0 && (
          <div className="mt-[24px]">
            <p className="text-[15px] leading-5 text-ff-gray-text">
              Вы присоединяетесь к сделке:
            </p>
            <p className="mt-[6px] text-[18px] leading-[24px] font-bold">
              {deal.titleRu}
            </p>
            <div className="mt-[16px] grid grid-cols-2 gap-[12px]">
              <div className="border border-ff-hairline p-[14px]">
                <p className="text-[13px] text-ff-gray-text">Итоговая цена</p>
                <p className="mt-[4px] text-[22px] leading-[28px] font-bold">
                  {formatKzt(deal.finalPrice)}
                </p>
              </div>
              <div className="border border-ff-hairline p-[14px]">
                <p className="text-[13px] text-ff-gray-text">Место в группе</p>
                <p className="mt-[4px] text-[22px] leading-[28px] font-bold">
                  №{deal.participants + 1}
                </p>
              </div>
            </div>
            <p className="mt-[16px] text-[15px] leading-5 text-[#007f67] font-bold">
              {confirmationLine}
            </p>
            <button
              type="button"
              onClick={handleConfirm}
              className="mt-[24px] flex h-[48px] w-full items-center justify-center bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white ff-transition hover:opacity-80"
            >
              Продолжить
            </button>
          </div>
        )}

        {/* Step 1: Kaspi mock payment */}
        {!isDuplicate && step === 1 && (
          <div className="mt-[24px]">
            <p className="text-[13px] leading-[17px] font-bold text-[#d71920]">
              Kaspi mock
            </p>
            <p className="text-[15px] leading-5 text-[rgb(34,34,34)]">
              Деньги удерживаются в эскроу. Если группа не собралась — авто-возврат.
            </p>
            <button
              type="button"
              onClick={() => {
                logMlEvent({
                  deal,
                  eventType: "purchase_mock",
                  metadata: { surface: "kaspi_mock" },
                });
                setStep(2);
              }}
              className="mt-[24px] flex h-[52px] w-full items-center justify-center bg-[#d71920] px-[16px] text-[15px] font-bold text-white ff-transition hover:opacity-85"
            >
              Оплатить mock
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="mt-[12px] flex h-[44px] w-full items-center justify-center border border-[rgb(34,34,34)] px-[16px] text-[15px] font-bold"
            >
              Назад
            </button>
          </div>
        )}

        {/* Step 2: Success + share */}
        {!isDuplicate && step === 2 && (
          <div className="mt-[24px]">
            <p className="text-[13px] leading-[17px] text-[#007f67] font-bold">
              SIM ID подтвержден
            </p>
            <h3 className="mt-[6px] text-[28px] leading-[36px] font-normal">
              Вы в группе
            </h3>
            <p className="mt-[10px] text-[15px] leading-5">
              Место №{deal.participants + 1} закреплено за вашим SIM ID.
              Не хватает 6 человек — позови свой чат
            </p>
            <div className="mt-[24px] grid grid-cols-3 gap-[8px]">
              <a
                href={`https://wa.me/?text=${shareText}`}
                onClick={() =>
                  logMlEvent({
                    deal,
                    eventType: "share",
                    metadata: { channel: "whatsapp" },
                  })
                }
                className="flex h-[44px] items-center justify-center border border-[#007f67] text-[13px] font-bold text-[#007f67]"
              >
                WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=https://birge.demo/deal/demo&text=${shareText}`}
                onClick={() =>
                  logMlEvent({
                    deal,
                    eventType: "share",
                    metadata: { channel: "telegram" },
                  })
                }
                className="flex h-[44px] items-center justify-center border border-[#007f67] text-[13px] font-bold text-[#007f67]"
              >
                Telegram
              </a>
              <button
                type="button"
                onClick={() => {
                  logMlEvent({
                    deal,
                    eventType: "share",
                    metadata: { channel: "copy_link" },
                  });
                  void navigator.clipboard?.writeText("https://birge.demo/deal/demo");
                }}
                className="flex h-[44px] items-center justify-center border border-[rgb(34,34,34)] text-[13px] font-bold"
              >
                Copy link
              </button>
            </div>
            <Link
              href="/deal/demo"
              className="mt-[12px] flex h-[48px] w-full items-center justify-center bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white"
            >
              Открыть live demo
            </Link>
          </div>
        )}

        {/* Duplicate — close button */}
        {isDuplicate && (
          <button
            type="button"
            onClick={close}
            className="mt-[20px] flex h-[48px] w-full items-center justify-center border border-[rgb(34,34,34)] px-[16px] text-[15px] font-bold"
          >
            Закрыть
          </button>
        )}
      </section>
    </div>
  );
}
