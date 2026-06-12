"use client";

import { useEffect, useState } from "react";
import { getRecentAuditEvents } from "@/lib/telecom/audit";
import type { TelecomAuditEvent } from "@/lib/telecom/audit";
import {
  TRUST_COPY_OTP_VERIFIED,
  TRUST_COPY_NETWORK_API_NOT_CONFIGURED,
} from "@/lib/telecom/risk";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoredTelecomIdentity {
  status: string;
  provider: string;
  realNetworkCheck: boolean;
  configured: boolean;
  trustScore: number;
  decision: "allow" | "step_up" | "block";
  simSwapRisk: "low" | "medium" | "high" | "unknown";
  checkedAt: string;
  phoneMasked: string | null;
  // Extended fields (may be absent in old records)
  verificationType?: "sms_otp" | "dev_mode";
  realSmsSent?: boolean;
  realVerification?: boolean;
  phoneVerified?: boolean;
}

interface TelecomStatusResponse {
  provider: string;
  configured: boolean;
  country: string;
  operatorHint: string;
  devMode: boolean;
  capabilities: string[];
  message: string;
  otp?: {
    provider: "mock" | "twilio" | "vonage" | "custom";
    enabled: boolean;
    configured: boolean;
    capability: "sms_otp";
  };
}

interface ApiAuditEvent {
  eventType: string;
  phoneHash?: string;
  deviceIdHash?: string;
  provider: string;
  realNetworkCheck: boolean;
  riskScore?: number;
  decision?: string;
  createdAt: string;
}

interface ApiAuditResponse {
  events: ApiAuditEvent[];
  count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readStoredIdentity(): StoredTelecomIdentity | null {
  try {
    const raw = localStorage.getItem("birge_telecom_identity");
    if (!raw) return null;
    return JSON.parse(raw) as StoredTelecomIdentity;
  } catch {
    return null;
  }
}

function readJoinedDealCount(): number {
  try {
    const raw = localStorage.getItem("birge_joined_deals");
    if (!raw) return 0;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  TELECOM_VERIFY_REQUESTED: "Запрос верификации",
  TELECOM_VERIFY_SUCCESS: "Верификация успешна",
  TELECOM_VERIFY_NOT_CONFIGURED: "Провайдер не настроен",
  SIM_SWAP_RISK_HIGH: "Высокий риск смены SIM",
  GROUP_SLOT_BOUND: "Слот в группе занят",
  DUPLICATE_DEVICE_BLOCKED: "Дубль устройства заблокирован",
  ESCROW_RISK_CHECK_PASSED: "Проверка эскроу прошла",
  // ── SMS OTP events ──
  OTP_SEND_REQUESTED: "Запрошена отправка OTP",
  OTP_SENT: "OTP-код отправлен",
  OTP_SEND_FAILED: "Ошибка отправки OTP",
  OTP_CHECK_REQUESTED: "Проверка OTP-кода",
  OTP_VERIFIED: "Номер подтверждён через OTP",
  OTP_INVALID_CODE: "Неверный OTP-код",
};

function labelEvent(eventType: string): string {
  return EVENT_TYPE_LABELS[eventType] ?? eventType;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ru-KZ", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function mergeAndSortEvents(
  apiEvents: ApiAuditEvent[],
  localEvents: TelecomAuditEvent[]
): ApiAuditEvent[] {
  const combined: ApiAuditEvent[] = [
    ...apiEvents,
    ...localEvents.map((e) => ({
      eventType: e.eventType,
      phoneHash: e.phoneHash,
      deviceIdHash: e.deviceIdHash,
      provider: e.provider,
      realNetworkCheck: e.realNetworkCheck,
      riskScore: e.riskScore,
      decision: e.decision,
      createdAt: e.createdAt,
    })),
  ];

  // Deduplicate by createdAt+eventType
  const seen = new Set<string>();
  const unique = combined.filter((ev) => {
    const key = `${ev.eventType}::${ev.createdAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort newest first, take last 5
  return unique
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────

function Chip({
  label,
  variant,
}: {
  label: string;
  variant: "green" | "amber" | "neutral" | "gray";
}) {
  const cls: Record<typeof variant, string> = {
    green: "border-[#007f67] text-[#007f67]",
    amber: "border-[#b45309] text-[#b45309] bg-[#fffbeb]",
    neutral: "border-[rgb(34,34,34)] text-[rgb(34,34,34)]",
    gray: "border-ff-hairline text-ff-gray-text",
  };
  return (
    <span
      className={`inline-flex items-center border px-[10px] py-[3px] text-[12px] font-bold leading-[16px] ${cls[variant]}`}
    >
      {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-[8px] py-[8px] border-b border-ff-hairline last:border-b-0">
      <span className="text-[13px] leading-[17px] text-ff-gray-text shrink-0">{label}</span>
      <span className="text-[13px] leading-[17px] font-bold text-right">{value}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TelecomProfileCard() {
  // Lazy-initialize from localStorage so we never call setState inside an effect body
  const [identity] = useState<StoredTelecomIdentity | null>(() => {
    if (typeof window === "undefined") return null;
    return readStoredIdentity();
  });
  const [joinedDealCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return readJoinedDealCount();
  });

  const [status, setStatus] = useState<TelecomStatusResponse | null>(null);
  const [auditEvents, setAuditEvents] = useState<ApiAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch API status + audit events in parallel
    Promise.all([
      fetch("/api/telecom/status")
        .then((r) => (r.ok ? (r.json() as Promise<TelecomStatusResponse>) : null))
        .catch(() => null),
      fetch("/api/telecom/audit")
        .then((r) => (r.ok ? (r.json() as Promise<ApiAuditResponse>) : null))
        .catch(() => null),
    ]).then(([statusData, auditData]) => {
      setStatus(statusData);

      const apiEvents = auditData?.events ?? [];
      const localEvents = getRecentAuditEvents(20);
      setAuditEvents(mergeAndSortEvents(apiEvents, localEvents));
      setLoading(false);
    });
  }, []);

  // ── Decision chip ──────────────────────────────────────────────────────────

  const decisionChip = identity ? (
    identity.decision === "allow" ? (
      <Chip label="allow" variant="green" />
    ) : identity.decision === "step_up" ? (
      <Chip label="step_up" variant="amber" />
    ) : (
      <Chip label="block" variant="neutral" />
    )
  ) : (
    <Chip label="—" variant="gray" />
  );

  // ── Verification state label ───────────────────────────────────────────────

  // Determine OTP verification path (new fields may be absent in old records)
  const isOtpVerified =
    identity?.verificationType === "sms_otp" &&
    identity?.realVerification === true;
  const isDevModeOtp =
    identity?.verificationType === "dev_mode" ||
    (identity !== null && identity.realVerification === false && identity.verificationType !== undefined);

  let verificationLabel: React.ReactNode;
  if (!identity) {
    verificationLabel = <span className="text-ff-gray-text">не пройдена</span>;
  } else if (isOtpVerified) {
    verificationLabel = (
      <span className="text-[#007f67]">✓ Phone verified via Live SMS OTP</span>
    );
  } else if (isDevModeOtp) {
    verificationLabel = (
      <span className="text-[#b45309]">Dev-mode OTP · realVerification: false</span>
    );
  } else if (identity.realNetworkCheck && identity.configured) {
    verificationLabel = (
      <span className="text-[#007f67]">✓ Real network check: true</span>
    );
  } else {
    verificationLabel = (
      <span className="text-[#b45309]">Dev-mode · realNetworkCheck: false</span>
    );
  }

  return (
    <article className="border border-ff-hairline p-[18px]">
      <p className="text-[13px] leading-[17px] text-ff-gray-text">
        Telecom identity
      </p>
      <h2 className="mt-[6px] text-[22px] leading-[28px] font-bold">
        Telecom Identity Panel
      </h2>

      {loading && (
        <p className="mt-[12px] text-[13px] text-ff-gray-text">Загрузка…</p>
      )}

      {!loading && (
        <>
          {/* Provider / configured status */}
          <div className="mt-[14px] flex flex-wrap gap-[8px]">
            {status ? (
              <>
                <Chip
                  label={`Provider: ${status.provider}`}
                  variant={status.configured ? "green" : "amber"}
                />
                <Chip
                  label={status.configured ? "Configured" : "Not configured"}
                  variant={status.configured ? "green" : "amber"}
                />
                {status.devMode && <Chip label="Dev-mode" variant="amber" />}
                {status.operatorHint && (
                  <Chip label={status.operatorHint} variant="neutral" />
                )}
              </>
            ) : (
              <Chip label="API недоступен" variant="gray" />
            )}
          </div>

          {/* Not-configured message block */}
          {status && !status.configured && (
            <p className="mt-[12px] text-[13px] leading-[18px] text-[rgb(100,80,30)] border border-[rgb(200,175,90)] bg-[#fffdf0] p-[10px]">
              Production provider not configured. Demo uses local device
              binding; architecture is ready for GSMA/Open Gateway, Vonage, or
              operator Network API.
            </p>
          )}

          {/* Verification details */}
          <div className="mt-[16px]">
            <Row label="SIM/eSIM статус" value={verificationLabel} />

            {/* OTP verification rows — only when new fields are present */}
            {identity && isOtpVerified && (
              <>
                <Row
                  label="Phone verified"
                  value={<span className="text-[#007f67]">true</span>}
                />
                <Row
                  label="Verification type"
                  value={
                    <span className="flex items-center gap-[6px]">
                      Live SMS OTP
                      <Chip label="OTP" variant="green" />
                    </span>
                  }
                />
                <Row label="Provider" value={identity.provider} />
                <Row
                  label="realVerification"
                  value={<span className="text-[#007f67]">true</span>}
                />
              </>
            )}

            {identity && isDevModeOtp && (
              <>
                <Row
                  label="Phone verified"
                  value={<span className="text-[#b45309]">dev-mode</span>}
                />
                <Row
                  label="Verification type"
                  value={
                    <span className="flex items-center gap-[6px]">
                      Dev-mode OTP
                      <Chip label="dev-mode" variant="amber" />
                    </span>
                  }
                />
                <Row
                  label="realVerification"
                  value={<span className="text-[#b45309]">false</span>}
                />
              </>
            )}

            <Row
              label="Риск смены SIM"
              value={
                identity ? (
                  identity.simSwapRisk === "low" ? (
                    <span className="text-[#007f67]">low</span>
                  ) : identity.simSwapRisk === "medium" ? (
                    <span className="text-[#b45309]">medium</span>
                  ) : identity.simSwapRisk === "high" ? (
                    <span className="text-[rgb(180,30,30)]">high</span>
                  ) : (
                    "unknown"
                  )
                ) : (
                  "—"
                )
              }
            />
            <Row
              label="Commerce trust score"
              value={
                identity ? (
                  <span>
                    {identity.trustScore} / 100 · {decisionChip}
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <Row
              label="Provider"
              value={identity ? identity.provider : (status?.provider ?? "—")}
            />
            <Row
              label="Последняя верификация"
              value={identity ? formatDate(identity.checkedAt) : "—"}
            />
            <Row
              label="Группы (слоты)"
              value={
                <span>
                  {joinedDealCount}{" "}
                  {joinedDealCount === 1 ? "группа" : "групп"}
                </span>
              }
            />
          </div>

          {/* Audit events */}
          <div className="mt-[20px]">
            <p className="text-[13px] leading-[17px] font-bold">
              Последние события аудита
            </p>
            {auditEvents.length === 0 ? (
              <p className="mt-[8px] text-[13px] text-ff-gray-text">
                События отсутствуют
              </p>
            ) : (
              <ul className="mt-[8px] space-y-[6px]">
                {auditEvents.map((ev, idx) => (
                  <li
                    key={`${ev.eventType}-${ev.createdAt}-${idx}`}
                    className="flex items-start justify-between gap-[8px] text-[13px] leading-[17px]"
                  >
                    <span className="text-[rgb(34,34,34)]">
                      {labelEvent(ev.eventType)}
                    </span>
                    <span className="text-ff-gray-text shrink-0 text-right">
                      {formatDate(ev.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* OTP verified trust copy */}
          {isOtpVerified && (
            <p className="mt-[14px] text-[13px] leading-[18px] text-[#007f67] border-l-[3px] border-[#007f67] pl-[10px]">
              {TRUST_COPY_OTP_VERIFIED}
            </p>
          )}

          {/* Network API not configured footnote */}
          {status && !status.configured && (
            <p className="mt-[10px] text-[12px] leading-[17px] text-ff-gray-text border-l-[3px] border-ff-hairline pl-[10px]">
              {TRUST_COPY_NETWORK_API_NOT_CONFIGURED}
            </p>
          )}
        </>
      )}
    </article>
  );
}
