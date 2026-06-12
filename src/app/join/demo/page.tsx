"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import type { LiveDemoState } from "@/lib/live-demo-store";

const DEVICE_ID_STORAGE_KEY = "birge-demo-device-id";
const DUPLICATE_MESSAGE =
  "Это устройство уже занимает место в группе. 1 SIM = 1 место.";

function createDeviceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function JoinDemoPage() {
  const [status, setStatus] = useState<
    "idle" | "checking" | "success" | "duplicate" | "error"
  >("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [lastApiStatus, setLastApiStatus] = useState<string>("not submitted");
  const [lastError, setLastError] = useState("");
  const [message, setMessage] = useState("");
  const [joinedSlot, setJoinedSlot] = useState<number | null>(null);
  const [debugDeviceId, setDebugDeviceId] = useState("");
  const [debugResponse, setDebugResponse] = useState("");

  // Ref guard prevents double-submission even before React re-renders
  const submittingRef = useRef(false);

  const isDevelopment = process.env.NODE_ENV !== "production";

  function getOrCreateDeviceId(): string {
    try {
      const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
      if (existing) {
        setDebugDeviceId(existing);
        return existing;
      }
    } catch {
      // localStorage blocked (private mode on some browsers)
    }

    const next = createDeviceId();

    try {
      window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, next);
    } catch {
      // Save failed — generated id is still valid for this session
    }

    setDebugDeviceId(next);
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) return;

    setSubmitCount((c) => c + 1);

    const formData = new FormData(event.currentTarget);
    const rawName = String(formData.get("demoName") || "").trim();

    if (rawName.length < 2) {
      setStatus("error");
      setMessage("Введите минимум 2 символа");
      setLastApiStatus("validation error");
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setStatus("checking");
    setMessage("Подтверждаем через сеть оператора…");
    setLastApiStatus("submitting");
    setLastError("");

    const deviceId = getOrCreateDeviceId();
    console.log("[join-demo] submit", { rawName, deviceId });

    try {
      const response = await fetch("/api/demo/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rawName, deviceId }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        joined?: boolean;
        duplicate?: boolean;
        slot?: number;
        message?: string;
        state?: LiveDemoState;
      };

      setLastApiStatus(String(response.status));
      setDebugResponse(JSON.stringify({ status: response.status, ok: data.ok, slot: data.slot }, null, 2));
      console.log("[join-demo] response", response.status, data);

      if (response.status === 409 || data.duplicate) {
        setStatus("duplicate");
        setMessage(data.message ?? DUPLICATE_MESSAGE);
        return;
      }

      if (!response.ok || !data.state) {
        setStatus("error");
        const msg = data.message ?? "Не удалось подключиться к live demo. Проверьте Wi-Fi и LAN URL.";
        setMessage(msg);
        setLastError(msg);
        return;
      }

      setJoinedSlot(data.slot ?? data.state.participants);
      setStatus("success");
      setMessage("");
    } catch (err) {
      const msg = "Не удалось подключиться к live demo. Проверьте Wi-Fi и LAN URL.";
      setStatus("error");
      setLastApiStatus("fetch failed");
      setLastError(String(err));
      setMessage(msg);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-white px-[24px] py-[32px]">
      <section className="mx-auto max-w-[480px]">
        <Link
          href="/"
          className="text-[24px] leading-none font-bold tracking-[0.18em]"
        >
          BIRGE
        </Link>
        <h1 className="mt-[40px] text-[34px] leading-[40px] font-normal">
          Быстрый вход в группу
        </h1>
        <p className="mt-[12px] text-[15px] leading-5 text-ff-gray-text">
          1 SIM = 1 место. В демо слот закрепляется за этим устройством и сразу
          обновляет live-экран.
        </p>

        {status !== "success" && (
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="demo-join-name"
              className="mt-[28px] block text-[13px] leading-[17px] font-bold"
            >
              Введите имя для демо
              <input
                id="demo-join-name"
                name="demoName"
                type="text"
                className="mt-[8px] h-[48px] w-full border border-[rgb(34,34,34)] px-[14px] text-[16px] outline-none"
                placeholder="Введите имя для демо"
                autoComplete="given-name"
                inputMode="text"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ touchAction: "manipulation", cursor: "pointer" }}
              className="mt-[20px] flex h-[50px] w-full items-center justify-center bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? "Подтверждаем через сеть оператора…" : "Вступить"}
            </button>
          </form>
        )}

        {isSubmitting && (
          <div className="mt-[16px] h-[3px] overflow-hidden bg-[rgb(238,238,238)]">
            <div className="h-full w-2/3 animate-pulse bg-[#007f67]" />
          </div>
        )}

        {status === "success" && joinedSlot !== null && (
          <div className="mt-[24px] border border-[#007f67] p-[18px]">
            <p className="text-[22px] leading-[28px] font-bold text-[#007f67]">
              Вы заняли место №{joinedSlot}
            </p>
            <p className="mt-[4px] text-[15px] leading-5 text-ff-gray-text">
              Ваш слот защищён SIM ID
            </p>
            <p className="mt-[8px] text-[13px] font-bold text-[rgb(34,34,34)]">
              Live counter updated · API status: {lastApiStatus}
            </p>
            <Link
              href="/deal/demo"
              className="mt-[18px] flex h-[48px] items-center justify-center bg-[#007f67] px-[16px] text-[15px] font-bold text-white"
            >
              Открыть live-экран
            </Link>
          </div>
        )}

        {(status === "duplicate" || status === "error") && (
          <div className="mt-[24px] border border-[#d71920] p-[18px]">
            <p className="text-[17px] leading-[23px] font-bold text-[#d71920]">
              {message}
            </p>
            <Link
              href="/deal/demo"
              className="mt-[18px] flex h-[48px] items-center justify-center border border-[rgb(34,34,34)] px-[16px] text-[15px] font-bold"
            >
              Открыть live-экран
            </Link>
          </div>
        )}

        {isDevelopment && (
          <div className="mt-[24px] border border-ff-hairline bg-[rgb(248,248,248)] p-[14px] text-[12px] leading-[18px] text-ff-gray-text">
            <p className="font-bold text-[rgb(34,34,34)]">join demo debug</p>
            <p>origin: {typeof window !== "undefined" ? window.location.origin : "(ssr)"}</p>
            <p>submitCount: {submitCount}</p>
            <p>isSubmitting: {String(isSubmitting)}</p>
            <p>deviceId set: {String(debugDeviceId.length > 0)}</p>
            <p>last API status: {lastApiStatus}</p>
            <p>last error: {lastError || "(none)"}</p>
            {debugResponse && (
              <pre className="mt-[4px] whitespace-pre-wrap break-all">{debugResponse}</pre>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
