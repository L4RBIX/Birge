"use client";

import { useEffect, useState } from "react";

interface OtpStatus {
  provider: "mock" | "twilio" | "vonage" | "custom";
  enabled: boolean;
  configured: boolean;
  capability: "sms_otp";
}

interface TelecomStatus {
  provider: string;
  configured: boolean;
  country: string;
  operatorHint: string;
  devMode: boolean;
  capabilities: string[];
  message?: string;
  otp?: OtpStatus;
}

const CAPABILITY_LABELS: Record<string, string> = {
  number_verify: "Number Verify",
  sim_swap_risk: "SIM Swap Risk",
  device_binding: "Device Binding",
  trusted_group_slot: "Trusted Group Slot",
};

export function TelecomSecurityStatusCard() {
  const [status, setStatus] = useState<TelecomStatus | null>(null);
  // Start in loading state; no setter needed before the fetch resolves
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/telecom/status")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<TelecomStatus>;
      })
      .then((data) => {
        if (!cancelled) {
          setStatus(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="border border-ff-hairline p-[24px]">
      <div className="flex items-center justify-between gap-[12px] flex-wrap">
        <p className="text-[13px] leading-[17px] font-bold text-[#007f67] uppercase tracking-widest">
          Live Telecom Status
        </p>
        <div className="flex items-center gap-[8px]">
          <span
            className={`h-[8px] w-[8px] rounded-full ${
              loading
                ? "bg-ff-gray-mid animate-pulse"
                : status?.configured
                  ? "bg-[#007f67]"
                  : "bg-amber-500"
            }`}
          />
          <span className="text-[12px] leading-[16px] text-ff-gray-text font-bold">
            {loading ? "Loading…" : status?.configured ? "Configured" : "Dev Mode"}
          </span>
        </div>
      </div>

      {loading && (
        <div className="mt-[20px] space-y-[10px]">
          {[80, 60, 90, 70].map((w) => (
            <div
              key={w}
              className="h-[14px] rounded bg-[rgb(246,246,246)] animate-pulse"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="mt-[16px] text-[15px] leading-5 text-[rgb(180,30,30)]">
          Error fetching status: {error}
        </p>
      )}

      {!loading && !error && status && (
        <div className="mt-[20px] space-y-[16px]">
          {/* Core fields */}
          <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3">
            <StatusField label="Provider" value={status.provider} />
            <StatusField label="Country" value={status.country} />
            <StatusField label="Operator" value={status.operatorHint} />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-[8px]">
            <Badge
              label={status.devMode ? "Dev Mode" : "Production"}
              variant={status.devMode ? "amber" : "green"}
            />
            <Badge
              label={status.configured ? "Configured" : "Not configured"}
              variant={status.configured ? "green" : "neutral"}
            />
          </div>

          {/* Not-configured message */}
          {!status.configured && status.message && (
            <div className="border border-amber-200 bg-amber-50 p-[12px]">
              <p className="text-[13px] leading-[18px] text-amber-800">
                <span className="font-bold">Note: </span>
                {status.message}
              </p>
            </div>
          )}

          {/* Capabilities */}
          <div>
            <p className="text-[12px] leading-[16px] font-bold text-ff-gray-text mb-[8px] uppercase tracking-widest">
              Capabilities
            </p>
            <div className="flex flex-wrap gap-[6px]">
              {status.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="border border-[rgb(34,34,34)] px-[10px] py-[4px] text-[12px] leading-[16px] font-bold"
                >
                  {CAPABILITY_LABELS[cap] ?? cap}
                </span>
              ))}
            </div>
          </div>

          {/* SMS OTP row */}
          {status.otp && (
            <div className="border-t border-ff-hairline pt-[16px]">
              <p className="text-[12px] leading-[16px] font-bold text-ff-gray-text mb-[8px] uppercase tracking-widest">
                SMS OTP
              </p>
              <div className="flex flex-wrap items-center gap-[8px]">
                <span className="text-[13px] leading-[17px] font-bold">
                  {status.otp.provider}
                </span>
                <span className="text-ff-gray-text text-[13px]">·</span>
                <Badge
                  label={status.otp.enabled ? "enabled" : "disabled"}
                  variant={status.otp.enabled && status.otp.configured ? "green" : "amber"}
                />
                <Badge
                  label={status.otp.configured ? "configured" : "не настроен"}
                  variant={status.otp.configured && status.otp.enabled ? "green" : "amber"}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] leading-[14px] font-bold text-ff-gray-text uppercase tracking-widest">
        {label}
      </p>
      <p className="mt-[4px] text-[15px] leading-5 font-bold">{value}</p>
    </div>
  );
}

function Badge({
  label,
  variant,
}: {
  label: string;
  variant: "green" | "amber" | "neutral";
}) {
  const cls =
    variant === "green"
      ? "bg-[#007f67] text-white"
      : variant === "amber"
        ? "bg-amber-100 text-amber-800 border border-amber-300"
        : "bg-[rgb(246,246,246)] text-ff-gray-text border border-ff-hairline";
  return (
    <span className={`px-[10px] py-[4px] text-[12px] leading-[16px] font-bold ${cls}`}>
      {label}
    </span>
  );
}
