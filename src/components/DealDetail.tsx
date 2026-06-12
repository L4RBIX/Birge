"use client";

import { useState } from "react";
import { DealVisual } from "@/components/DealVisual";
import { JoinDealSheet } from "@/components/JoinDealSheet";
import { LiveCountdown } from "@/components/LiveCountdown";
import { formatKzt } from "@/lib/birge-content";
import type { Deal } from "@/types/birge";

export function DealDetail({ deal }: { deal: Deal }) {
  const [joinOpen, setJoinOpen] = useState(false);
  const progress = Math.min(100, Math.round((deal.participants / deal.target) * 100));
  const missing = Math.max(0, deal.target - deal.participants);
  const retailUsd = Math.max(9, Math.round(deal.retailPrice / 514));
  const wholesaleUsd = Math.max(7, Math.round(deal.groupPrice / 513));

  return (
    <section id="deal-detail" className="max-w-[1440px] mx-auto px-[24px] pt-[56px] pb-[32px]">
      <div className="grid gap-[24px] lg:grid-cols-2 lg:items-start">
        <div className="grid grid-cols-[72px_1fr] gap-[12px] max-[479px]:grid-cols-1">
          <div className="flex flex-col gap-[12px] max-[479px]:order-last max-[479px]:grid max-[479px]:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <DealVisual
                key={item}
                deal={deal}
                compact
                className={item === 0 ? "" : "opacity-85"}
              />
            ))}
          </div>
          <DealVisual deal={deal} className="w-full" />
        </div>

        <div className="lg:pl-[24px]">
          <p className="text-[13px] leading-[17px] text-ff-gray-text">
            {deal.source} · {deal.city} · {deal.categoryLabel}
          </p>
          <h2 className="mt-[8px] max-w-[620px] text-[38px] leading-[48px] font-normal text-[rgb(34,34,34)] max-[479px]:text-[28px] max-[479px]:leading-[36px]">
            {deal.titleRu}
          </h2>
          <p className="mt-[8px] text-[15px] leading-5 text-ff-gray-text">
            {deal.titleKz} · {deal.description}
          </p>
          <p className="mt-[12px] text-[15px] leading-5 text-[rgb(34,34,34)]">
            Почему рекомендовано: {deal.recommendation}. Рекомендации строятся не на магии:
            интересы + город + бюджет + скорость набора группы.
          </p>

          <div className="mt-[24px] border-y border-ff-hairline py-[18px]">
            <div className="flex items-center justify-between gap-[16px]">
              <div>
                <p className="text-[13px] leading-[17px] text-ff-gray-text">
                  Группа
                </p>
                <p className="text-[32px] leading-[40px] font-bold text-[#007f67]">
                  {deal.participants}/{deal.target}
                </p>
                <p className="text-[13px] leading-[17px] text-ff-gray-text">
                  осталось {missing}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[13px] leading-[17px] text-ff-gray-text">
                  Countdown
                </p>
                <LiveCountdown countdown={deal.countdown} className="text-[22px] leading-[28px] font-bold" />
              </div>
            </div>
            <div className="mt-[12px] h-[5px] bg-[rgb(230,230,230)]">
              <div className="h-full bg-[#00a884]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-[16px] flex -space-x-[8px]">
              {["АС", "ЕР", "ДМ", "МК", "SIM"].map((avatar) => (
                <span
                  key={avatar}
                  className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-white bg-[rgb(245,245,245)] text-[11px] font-bold text-[#007f67]"
                >
                  {avatar}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-[24px]">
            <h3 className="text-[22px] leading-[28px] font-normal">
              Price waterfall
            </h3>
            <div className="mt-[12px] space-y-[8px] text-[15px] leading-5">
              <p>Розница ${retailUsd} = {formatKzt(deal.retailPrice)}</p>
              <p>→ Опт при {deal.target} шт: ${wholesaleUsd} = {formatKzt(deal.groupPrice)}</p>
              <p>→ + карго {formatKzt(deal.cargoCost)}/чел</p>
              <p className="text-[26px] leading-[32px] font-bold">
                → Итог {formatKzt(deal.finalPrice)} <span className="text-[#007f67]">(−{deal.discount}%)</span>
              </p>
            </div>
          </div>

          <div className="mt-[24px] grid grid-cols-3 gap-[8px]">
            {deal.tiers.map((tier) => (
              <div
                key={tier.people}
                className={
                  tier.status === "current"
                    ? "border border-[#007f67] p-[12px]"
                    : "border border-ff-hairline p-[12px]"
                }
              >
                <p className="text-[13px] leading-[17px] font-bold">
                  {tier.people} человек
                </p>
                <p className="mt-[4px] text-[15px] leading-5 text-[#007f67] font-bold">
                  −{tier.discount}%
                </p>
                <p className="mt-[4px] text-[12px] leading-[16px] text-ff-gray-text">
                  {tier.status === "unlocked"
                    ? "разблокировано"
                    : tier.status === "current"
                      ? `осталось ${missing}`
                      : "закрыто"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-[24px] grid gap-[10px] sm:grid-cols-2">
            {[
              ["Interest match", deal.recommendationSignals.interestMatch],
              ["Budget fit", deal.recommendationSignals.budgetFit],
              ["City match", deal.recommendationSignals.cityMatch],
              ["Momentum", deal.recommendationSignals.momentum],
            ].map(([label, value]) => (
              <div key={label} className="border border-ff-hairline p-[12px]">
                <p className="text-[13px] leading-[17px] text-ff-gray-text">{label}</p>
                <p className="mt-[4px] text-[18px] leading-[24px] font-bold text-[#007f67]">
                  {Number(value).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <ul className="mt-[24px] space-y-[8px] border-y border-ff-hairline py-[16px]">
            {deal.escrowNotes.map((note) => (
              <li key={note} className="text-[15px] leading-5">
                {note}
              </li>
            ))}
          </ul>

          <div className="mt-[24px]">
            <h3 className="text-[22px] leading-[28px] font-normal">
              Escrow lifecycle
            </h3>
            <div className="mt-[12px] grid gap-[8px] sm:grid-cols-2">
              {[
                "слот закреплён",
                "деньги удерживаются в эскроу",
                "группа собралась",
                "заказ уходит в карго-консолидацию",
                "выдача через ПВЗ / доставку",
                "авто-возврат если группа не собралась",
              ].map((item) => (
                <p key={item} className="border border-ff-hairline px-[12px] py-[10px] text-[13px] leading-[17px]">
                  {item}
                </p>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="mt-[24px] flex h-[52px] w-full items-center justify-center bg-[rgb(34,34,34)] px-[16px] text-[15px] font-bold text-white ff-transition hover:opacity-80"
          >
            Вступить в группу
          </button>
        </div>
      </div>
      <JoinDealSheet deal={deal} open={joinOpen} onOpenChange={setJoinOpen} />
    </section>
  );
}
