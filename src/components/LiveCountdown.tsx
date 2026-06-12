"use client";

import { useEffect, useState } from "react";
import { parseCountdownToSeconds, formatDuration, getRemainingSeconds } from "@/lib/time";

export type LiveCountdownProps = {
  deadlineAt?: string | Date;
  initialSeconds?: number;
  countdown?: string;
  expiredLabel?: string;
  className?: string;
};

export function LiveCountdown({
  deadlineAt,
  initialSeconds,
  countdown,
  expiredLabel = "Завершено",
  className,
}: LiveCountdownProps) {
  const [seconds, setSeconds] = useState<number>(() => {
    if (deadlineAt) return getRemainingSeconds(deadlineAt);
    if (typeof initialSeconds === "number") return Math.max(0, initialSeconds);
    if (countdown) return parseCountdownToSeconds(countdown);
    return 0;
  });

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => {
      setSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(id);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
    // Only run once — initial seconds already captured in state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (seconds <= 0) {
    return (
      <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
        {expiredLabel}
      </span>
    );
  }

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {formatDuration(seconds)}
    </span>
  );
}
