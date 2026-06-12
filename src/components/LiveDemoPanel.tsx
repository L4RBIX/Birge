"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RealJoinQr } from "@/components/RealJoinQr";
import { formatKzt } from "@/lib/birge-content";
import type { LiveDemoState } from "@/lib/live-demo-store";
import { buildAuditEvent, recordAuditEvent } from "@/lib/telecom/audit";
import type { TelecomProviderName } from "@/lib/telecom/types";

const DEMO_NAMES = [
  "Айгерим",
  "Данияр",
  "Асель",
  "Нурлан",
  "Мадина",
  "Ержан",
  "Камила",
  "Алихан",
];

const initialToasts = [
  "Айгерим из Алматы вступила · место №15",
  "Данияр прошёл SIM ID · место №16",
  "Тир 20 почти разблокирован · осталось 4",
];

const initialDemoState: LiveDemoState = {
  participants: 14,
  target: 20,
  price: 17900,
  retailPrice: 25200,
  discount: -29,
  duplicateBlocked: 0,
  activity: initialToasts,
  updatedAt: 0,
  finaleUnlocked: false,
  savingsText: "Вы только что сэкономили друг другу 36 400 ₸",
};

interface DebugState {
  lastPollAt: string;
  apiParticipants: number;
  renderedParticipants: number;
  apiUpdatedAt: number;
  pollError: string;
  apiUrlUsed: string;
  stateSource: "api" | "fallback";
  serverNow: number;
  requestHost: string;
}

interface TelecomStatusResponse {
  provider: TelecomProviderName;
  configured: boolean;
  devMode: boolean;
  operatorHint?: string;
}

// ─── Trusted Group Counter panel ──────────────────────────────────────────────
function TrustedGroupCounter({
  participants,
  trustedSlots,
  duplicatesBlocked,
  provider,
  realNetworkCheck,
  simSwapRisk,
}: {
  participants: number;
  trustedSlots: number;
  duplicatesBlocked: number;
  provider: TelecomProviderName | null;
  realNetworkCheck: boolean;
  simSwapRisk: "low" | "unknown";
}) {
  return (
    <div className="mt-[32px] rounded-[8px] border border-ff-hairline bg-[rgb(248,248,248)] px-[18px] py-[16px]">
      <p className="text-[13px] leading-[17px] font-bold tracking-[0.06em] text-ff-gray-text uppercase">
        Trusted group counter
      </p>
      <div className="mt-[12px] space-y-[8px] text-[14px] leading-5">
        <div className="flex items-center justify-between gap-[8px]">
          <span className="text-ff-gray-text">participants</span>
          <span className="font-bold tabular-nums text-[rgb(34,34,34)]">
            {participants}/20
          </span>
        </div>
        <div className="flex items-center justify-between gap-[8px]">
          <span className="text-ff-gray-text">trusted SIM slots</span>
          <span className="font-bold tabular-nums text-[#007f67]">
            {trustedSlots}
          </span>
        </div>
        <div className="flex items-center justify-between gap-[8px]">
          <span className="text-ff-gray-text">duplicate joins blocked</span>
          <span className="font-bold tabular-nums text-[#d71920]">
            {duplicatesBlocked}
          </span>
        </div>
        <div className="flex items-center justify-between gap-[8px]">
          <span className="text-ff-gray-text">provider</span>
          <span className="font-bold text-[rgb(34,34,34)]">
            {provider ?? "…"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-[8px]">
          <span className="text-ff-gray-text">realNetworkCheck</span>
          <span
            className={`font-bold ${realNetworkCheck ? "text-[#007f67]" : "text-[#c57c00]"}`}
          >
            {realNetworkCheck ? "true" : "false"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-[8px]">
          <span className="text-ff-gray-text">SIM swap risk</span>
          <span className="font-bold text-[rgb(34,34,34)]">{simSwapRisk}</span>
        </div>
      </div>
      <p className="mt-[14px] border-t border-ff-hairline pt-[12px] text-[12px] leading-[18px] text-ff-gray-text">
        Обычный marketplace считает аккаунты. Birge считает trusted SIM/eSIM slots.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LiveDemoPanel() {
  const [demoState, setDemoState] = useState<LiveDemoState>(initialDemoState);
  const [nameIndex, setNameIndex] = useState(2);

  const [provider, setProvider] = useState<TelecomProviderName | null>(null);
  const [realNetworkCheck] = useState(false);
  const [simSwapRisk] = useState<"low" | "unknown">("unknown");

  const [debug, setDebug] = useState<DebugState>({
    lastPollAt: "—",
    apiParticipants: initialDemoState.participants,
    renderedParticipants: initialDemoState.participants,
    apiUpdatedAt: 0,
    pollError: "",
    apiUrlUsed: "/api/demo/group-state",
    stateSource: "fallback",
    serverNow: 0,
    requestHost: "",
  });

  useEffect(() => {
    fetch("/api/telecom/status")
      .then((r) => r.json() as Promise<TelecomStatusResponse>)
      .then((data) => setProvider(data.provider))
      .catch(() => setProvider("mock"));
  }, []);

  // useCallback ensures a stable reference so the useEffect dep array is stable
  // and never re-subscribes after mount.
  const refreshState = useCallback(async () => {
    try {
      const res = await fetch("/api/demo/group-state", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const raw = (await res.json()) as {
        ok?: boolean;
        participants: number;
        target: number;
        price: number;
        retailPrice: number;
        discount: number;
        duplicateBlocked: number;
        activity: string[];
        updatedAt: number;
        finaleUnlocked: boolean;
        savingsText: string;
        serverNow?: number;
        requestHost?: string;
      };

      console.log("[deal-demo] poll state", raw);

      // Explicit field mapping — never spread unknown API shape into state
      const next: LiveDemoState = {
        participants: raw.participants,
        target: raw.target,
        price: raw.price,
        retailPrice: raw.retailPrice ?? 25200,
        discount: raw.discount,
        duplicateBlocked: raw.duplicateBlocked,
        activity: raw.activity,
        updatedAt: raw.updatedAt,
        finaleUnlocked: raw.finaleUnlocked,
        savingsText: raw.savingsText,
      };

      setDemoState(next);
      setDebug({
        lastPollAt: new Date().toLocaleTimeString(),
        apiParticipants: raw.participants,
        renderedParticipants: raw.participants,
        apiUpdatedAt: raw.updatedAt,
        pollError: "",
        apiUrlUsed: "/api/demo/group-state",
        stateSource: "api",
        serverNow: raw.serverNow ?? 0,
        requestHost: raw.requestHost ?? "",
      });
    } catch (err) {
      console.error("[deal-demo] poll error", err);
      setDebug((prev) => ({ ...prev, pollError: String(err) }));
    }
  }, []); // stable: no external deps, only calls stable React setters

  useEffect(() => {
    void refreshState();
    const id = window.setInterval(() => {
      void refreshState();
    }, 1000);
    return () => window.clearInterval(id);
  }, [refreshState]);

  async function postAction(
    endpoint: "/api/demo/join" | "/api/demo/reset" | "/api/demo/unlock-tier",
    body?: Record<string, string>
  ) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const raw = (await res.json()) as { state?: LiveDemoState; ok?: boolean };
      if (raw.state) {
        const next: LiveDemoState = {
          participants: raw.state.participants,
          target: raw.state.target,
          price: raw.state.price,
          retailPrice: raw.state.retailPrice ?? 25200,
          discount: raw.state.discount,
          duplicateBlocked: raw.state.duplicateBlocked,
          activity: raw.state.activity,
          updatedAt: raw.state.updatedAt,
          finaleUnlocked: raw.state.finaleUnlocked,
          savingsText: raw.state.savingsText,
        };
        setDemoState(next);
        setDebug((prev) => ({
          ...prev,
          apiParticipants: next.participants,
          renderedParticipants: next.participants,
          stateSource: "api",
          lastPollAt: new Date().toLocaleTimeString(),
        }));
      } else {
        await refreshState();
      }
    } catch {
      await refreshState();
    }
  }

  async function simulateJoin() {
    const name = DEMO_NAMES[nameIndex % DEMO_NAMES.length];
    setNameIndex((i) => i + 1);
    await postAction("/api/demo/join", {
      name,
      deviceId: `projector-${Date.now()}-${nameIndex}`,
    });
  }

  async function simulateDuplicate() {
    const deviceId = "projector-duplicate-demo-device";
    await postAction("/api/demo/join", { name: "Duplicate demo", deviceId });
    await postAction("/api/demo/join", { name: "Duplicate demo", deviceId });
    recordAuditEvent(
      buildAuditEvent("DUPLICATE_DEVICE_BLOCKED", {
        provider: provider ?? "mock",
        realNetworkCheck,
        decision: "block",
      })
    );
  }

  async function unlockTier() {
    await postAction("/api/demo/unlock-tier");
  }

  async function reset() {
    setNameIndex(2);
    await postAction("/api/demo/reset");
  }

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <section className="min-h-dvh overflow-x-hidden bg-white px-[24px] py-[32px] text-[rgb(34,34,34)]">
      <div className="mx-auto grid max-w-full gap-[32px] lg:max-w-[1440px] lg:grid-cols-[420px_1fr] lg:items-center">
        <div className="aspect-square w-full max-w-full border border-[rgb(34,34,34)] p-[24px]">
          <RealJoinQr />
        </div>

        <div>
          <Link
            href="/"
            className="inline-block text-[24px] leading-none font-bold tracking-[0.18em]"
          >
            BIRGE
          </Link>
          <p className="text-[15px] leading-5 font-bold text-[#007f67]">
            Live group deal
          </p>
          <h1 className="mt-[12px] max-w-[820px] text-[48px] leading-[56px] font-normal max-[479px]:text-[34px] max-[479px]:leading-[40px]">
            Сейчас вы сами станете групповой покупкой
          </h1>
          <p className="mt-[12px] text-[22px] leading-[28px] text-[rgb(34,34,34)]">
            Беспроводные наушники с шумоподавлением
          </p>
          <p className="mt-[10px] max-w-[760px] text-[15px] leading-5 text-ff-gray-text">
            Без SIM-bound identity этот счётчик можно накрутить ботами. Birge
            защищает группу: 1 SIM = 1 место.
          </p>

          <div className="mt-[32px] flex flex-wrap items-end gap-[32px]">
            <div>
              <p className="text-[15px] text-ff-gray-text">Группа</p>
              <p className="text-[96px] leading-none font-bold tabular-nums max-[479px]:text-[68px]">
                {demoState.participants}/{demoState.target}
              </p>
            </div>
            <div>
              <p className="text-[15px] text-ff-gray-text">Текущая цена</p>
              <p className="text-[52px] leading-none font-bold max-[479px]:text-[36px]">
                {formatKzt(demoState.price)}
              </p>
              <p className="mt-[6px] text-[13px] leading-[17px] text-ff-gray-text">
                Розница {formatKzt(demoState.retailPrice)}
              </p>
            </div>
            <div>
              <p className="text-[15px] text-ff-gray-text">Скидка</p>
              <p className="text-[52px] leading-none font-bold text-[#007f67] max-[479px]:text-[36px]">
                −{Math.abs(demoState.discount)}%
              </p>
            </div>
          </div>

          {demoState.finaleUnlocked && (
            <p className="mt-[24px] text-[30px] leading-[38px] font-bold text-[#007f67]">
              {demoState.savingsText}
            </p>
          )}

          <TrustedGroupCounter
            participants={demoState.participants}
            trustedSlots={demoState.participants}
            duplicatesBlocked={demoState.duplicateBlocked}
            provider={provider}
            realNetworkCheck={realNetworkCheck}
            simSwapRisk={simSwapRisk}
          />

          <div className="mt-[32px] flex flex-wrap gap-[12px]">
            <button
              type="button"
              onClick={simulateJoin}
              disabled={demoState.participants >= demoState.target}
              className="h-[48px] bg-[rgb(34,34,34)] px-[18px] text-[15px] font-bold text-white disabled:opacity-50"
            >
              Simulate join
            </button>
            <button
              type="button"
              onClick={simulateDuplicate}
              className="h-[48px] border border-[#d71920] px-[18px] text-[15px] font-bold text-[#d71920]"
            >
              Simulate duplicate
            </button>
            <button
              type="button"
              onClick={unlockTier}
              className="h-[48px] border border-[#007f67] px-[18px] text-[15px] font-bold text-[#007f67]"
            >
              Unlock tier
            </button>
            <button
              type="button"
              onClick={reset}
              className="h-[48px] border border-[rgb(34,34,34)] px-[18px] text-[15px] font-bold"
            >
              Reset demo
            </button>
            {isDev && (
              <button
                type="button"
                onClick={() => void refreshState()}
                className="h-[48px] border border-[#007f67] bg-[#007f67] px-[18px] text-[15px] font-bold text-white"
              >
                Refresh API state
              </button>
            )}
          </div>

          <div className="mt-[32px] space-y-[10px]" aria-live="polite">
            {demoState.activity.map((toast, index) => (
              <p
                key={`${toast}-${index}`}
                className="border border-ff-hairline bg-white px-[16px] py-[12px] text-[15px] leading-5"
              >
                {toast}
              </p>
            ))}
          </div>

          {isDev && (
            <div className="mt-[24px] border border-ff-hairline bg-[rgb(248,248,248)] px-[14px] py-[12px] font-mono text-[12px] leading-[20px] text-ff-gray-text">
              <p className="font-bold text-[rgb(34,34,34)]">projector debug</p>
              <p>lastPollAt: {debug.lastPollAt}</p>
              <p>apiParticipants: {debug.apiParticipants}</p>
              <p>renderedParticipants: {demoState.participants}</p>
              <p>apiUpdatedAt: {debug.apiUpdatedAt ? new Date(debug.apiUpdatedAt).toISOString() : "—"}</p>
              <p>pollError: {debug.pollError || "(none)"}</p>
              <p>apiUrlUsed: {debug.apiUrlUsed}</p>
              <p>stateSource: {debug.stateSource}</p>
              <p>serverNow: {debug.serverNow ? new Date(debug.serverNow).toISOString() : "—"}</p>
              <p>requestHost: {debug.requestHost || "—"}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
