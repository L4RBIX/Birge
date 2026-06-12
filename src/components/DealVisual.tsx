"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Deal } from "@/types/birge";

export function DealVisual({
  deal,
  className,
  priority = false,
  compact = false,
}: {
  deal: Deal;
  className?: string;
  priority?: boolean;
  compact?: boolean;
}) {
  const [useFallback, setUseFallback] = useState(false);
  const showPhoto = Boolean(deal.image && !useFallback);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-[rgb(244,244,244)] aspect-[3/4]",
        className
      )}
      aria-label={deal.titleRu}
      role="img"
    >
      {showPhoto ? (
        <img
          src={compact ? deal.image480 : deal.image}
          srcSet={compact ? undefined : `${deal.image480} 480w, ${deal.image} 720w`}
          sizes={compact ? "112px" : "(max-width: 479px) 249px, 25vw"}
          alt={deal.titleRu}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setUseFallback(true)}
          className="h-full w-full object-contain p-[10px]"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-[8px] p-[18px] text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#007f67]">
            {deal.categoryLabel}
          </p>
          <p className="text-[15px] font-bold text-black">Image unavailable</p>
          <p className="max-w-[220px] text-[12px] leading-[1.35] text-ff-gray-text">
            {deal.titleRu}
          </p>
        </div>
      )}

      {compact && (
        <div className="pointer-events-none absolute inset-x-[6px] bottom-[6px] rounded-[2px] bg-white/88 px-[6px] py-[4px] text-center">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[#007f67]">
            {deal.categoryLabel}
          </p>
        </div>
      )}
    </div>
  );
}
