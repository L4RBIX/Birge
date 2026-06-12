"use client";

import { useMemo, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";

export function RealJoinQr() {
  const demoBaseUrl = process.env.NEXT_PUBLIC_DEMO_BASE_URL?.replace(
    /\/$/,
    ""
  );
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => ""
  );
  const joinPath = "/join/demo";
  const joinUrl = useMemo(
    () => {
      if (demoBaseUrl) return `${demoBaseUrl}${joinPath}`;
      if (origin) return `${origin}${joinPath}`;

      return joinPath;
    },
    [demoBaseUrl, origin]
  );
  const canCopy = joinUrl !== joinPath;

  async function copyJoinLink() {
    if (!canCopy) return;

    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch {
      // Clipboard access can be blocked on non-secure origins. The URL remains visible.
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="w-full max-w-[300px] bg-white p-[18px] max-[479px]:max-w-[260px] max-[479px]:p-[14px]">
        <QRCode
          value={joinUrl}
          size={300}
          bgColor="#ffffff"
          fgColor="#222222"
          level="M"
          className="h-auto w-full min-w-[220px] max-[479px]:min-w-[220px]"
          title="Birge join demo QR code"
        />
      </div>
      <p className="mt-[16px] text-[15px] font-bold">
        Сканируйте, чтобы вступить
      </p>
      <p className="mt-[4px] max-w-[320px] break-all text-[13px] leading-[17px] text-ff-gray-text">
        {canCopy ? joinUrl : joinPath}
      </p>
      <button
        type="button"
        onClick={copyJoinLink}
        disabled={!canCopy}
        className="mt-[12px] min-h-[44px] border border-[rgb(34,34,34)] px-[14px] text-[13px] font-bold disabled:opacity-40"
      >
        Copy join link
      </button>
      <p className="mt-[12px] max-w-[340px] text-[11px] leading-[16px] text-ff-gray-text">
        Для телефона используйте тот же Wi-Fi и откройте dev server через LAN IP,
        например http://192.168.x.x:3000/join/demo
      </p>
    </div>
  );
}
