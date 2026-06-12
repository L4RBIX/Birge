"use client";

import {
  formatBudgetLabel,
  type StoredBirgeProfile,
} from "@/lib/kz-options";

interface ProfileIdentitySummaryProps {
  fallback: StoredBirgeProfile;
  interests: string[];
}

export function ProfileIdentitySummary({
  fallback,
  interests,
}: ProfileIdentitySummaryProps) {
  const budgetLabel = formatBudgetLabel(fallback);

  return (
    <div>
      <p className="text-[15px] leading-5 font-bold text-[#007f67]">
        SIM ID verified
      </p>
      <h1 className="mt-[12px] text-[38px] leading-[48px] font-normal max-[479px]:text-[30px] max-[479px]:leading-[38px]">
        {fallback.name}
      </h1>
      <p className="mt-[8px] text-[15px] leading-5 text-ff-gray-text">
        {fallback.city}
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
