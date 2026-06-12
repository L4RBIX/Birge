"use client";

import { useSyncExternalStore } from "react";
import {
  formatBudgetLabel,
  type StoredBirgeProfile,
} from "@/lib/kz-options";

interface ProfileIdentitySummaryProps {
  fallback: StoredBirgeProfile;
  interests: string[];
}

function readStoredProfile(): StoredBirgeProfile | null {
  try {
    const raw = localStorage.getItem("birge_profile");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredBirgeProfile>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      name: typeof parsed.name === "string" && parsed.name ? parsed.name : "",
      age: typeof parsed.age === "string" ? parsed.age : undefined,
      gender: typeof parsed.gender === "string" ? parsed.gender : undefined,
      city: typeof parsed.city === "string" && parsed.city ? parsed.city : "",
      budgetBand:
        typeof parsed.budgetBand === "string" && parsed.budgetBand
          ? parsed.budgetBand
          : "",
      budgetMin:
        typeof parsed.budgetMin === "number" ? parsed.budgetMin : undefined,
      budgetMax:
        typeof parsed.budgetMax === "number" ? parsed.budgetMax : undefined,
    };
  } catch {
    return null;
  }
}

export function ProfileIdentitySummary({
  fallback,
  interests,
}: ProfileIdentitySummaryProps) {
  const storedProfile = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    readStoredProfile,
    () => null
  );

  const display: StoredBirgeProfile = {
    ...fallback,
    ...(storedProfile ?? {}),
    name: storedProfile?.name || fallback.name,
    city: storedProfile?.city || fallback.city,
    budgetBand: storedProfile?.budgetBand || fallback.budgetBand,
  };
  const budgetLabel = formatBudgetLabel(display);

  return (
    <div>
      <p className="text-[15px] leading-5 font-bold text-[#007f67]">
        SIM ID verified
      </p>
      <h1 className="mt-[12px] text-[38px] leading-[48px] font-normal max-[479px]:text-[30px] max-[479px]:leading-[38px]">
        {display.name}
      </h1>
      <p className="mt-[8px] text-[15px] leading-5 text-ff-gray-text">
        {display.city}
      </p>
      <p className="mt-[16px] text-[15px] leading-5">
        Interests: {interests.join(" · ")}
      </p>
      <p className="mt-[6px] text-[15px] leading-5">
        Budget: {budgetLabel}
      </p>
      <div className="mt-[18px] inline-flex min-h-[44px] items-center border border-[#007f67] px-[14px] text-[14px] font-bold text-[#007f67]">
        Устройство привязано через SIM ID
      </div>
    </div>
  );
}
