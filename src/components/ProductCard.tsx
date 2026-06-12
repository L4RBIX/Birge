"use client";

import Link from "next/link";
import { useState } from "react";
import { HeartIcon, HeartFillIcon } from "@/components/icons";
import { DealVisual } from "@/components/DealVisual";
import { LiveCountdown } from "@/components/LiveCountdown";
import { formatKzt } from "@/lib/birge-content";
import { logMlEvent } from "@/lib/ml-api";
import type { Deal } from "@/types/birge";

export function ProductCard({ product }: { product: Deal }) {
  const [wishlisted, setWishlisted] = useState(false);
  const progress = Math.min(100, Math.round((product.participants / product.target) * 100));

  return (
    <article className="relative w-full">
      <Link
        href={product.href}
        className="block group"
        onClick={() => logMlEvent({ deal: product, eventType: "click", metadata: { surface: "product_card" } })}
      >
        {/* Image box */}
        <div className="aspect-[3/4] w-full overflow-hidden">
          <DealVisual deal={product} className="h-full w-full" compact />
        </div>

        {/* Meta block */}
        <div className="mt-[6px] w-full">
          {/* Badge */}
          <p
            className="text-[13px] leading-[17px] text-ff-gray-text"
          >
            {product.city} · {product.source} · {product.categoryLabel}
          </p>

          {/* Title */}
          <p className="text-[15px] font-bold text-[rgb(34,34,34)] mt-[4px] group-hover:underline">
            {product.titleRu}
          </p>

          {/* Trust */}
          <p className="mt-[3px] text-[13px] text-[#007f67] font-bold">
            SIM ✓ · 1 SIM = 1 место
          </p>

          {/* Price row */}
          <div className="mt-[4px] inline-flex flex-wrap gap-x-[4px] items-baseline">
            <span className="text-[13px] text-ff-gray-text line-through">
              {formatKzt(product.retailPrice)}
            </span>
            <span className="text-[18px] leading-[22px] font-bold text-[rgb(34,34,34)]">
              {formatKzt(product.finalPrice)}
            </span>
          </div>

          <div className="mt-[8px]">
            <div className="flex items-center justify-between text-[13px] leading-[17px]">
              <span className="font-bold text-[#007f67]">
                {product.participants}/{product.target}
              </span>
              <span className="font-bold text-[rgb(34,34,34)]">
                −{product.discount}%
              </span>
            </div>
            <div className="mt-[5px] h-[4px] bg-[rgb(230,230,230)]">
              <div
                className="h-full bg-[#00a884]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="mt-[8px] text-[13px] leading-[17px] text-[rgb(34,34,34)]">
            Осталось: <LiveCountdown countdown={product.countdown} className="font-bold" />
          </p>
          <p className="mt-[4px] text-[12px] leading-[16px] text-ff-gray-text">
            Почему рекомендовано: {product.recommendation}
          </p>
          <p className="mt-[4px] text-[12px] leading-[16px] text-ff-gray-text">
            score {product.recommendationSignals.score.toFixed(2)} · интересы + город + бюджет + скорость
          </p>
          <span className="mt-[10px] inline-flex h-[32px] items-center justify-center border border-[rgb(34,34,34)] px-[12px] text-[13px] font-bold group-hover:bg-[rgb(34,34,34)] group-hover:text-white ff-transition">
            Вступить
          </span>
        </div>
      </Link>

      {/* Wishlist button */}
      <button
        type="button"
        aria-label="Save deal"
        className="absolute top-0 right-0 w-[44px] h-[44px] flex items-center justify-center bg-transparent"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setWishlisted((prev) => !prev);
        }}
      >
        {wishlisted ? (
          <HeartFillIcon className="w-6 h-6 text-[rgb(34,34,34)]" />
        ) : (
          <HeartIcon className="w-6 h-6 text-[rgb(34,34,34)]" />
        )}
      </button>
    </article>
  );
}
