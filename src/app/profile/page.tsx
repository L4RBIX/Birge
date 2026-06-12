import Link from "next/link";
import { BannerStrip } from "@/components/BannerStrip";
import { DealVisual } from "@/components/DealVisual";
import { ProfileIdentitySummary } from "@/components/ProfileIdentitySummary";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { TelecomProfileCard } from "@/components/telecom/TelecomProfileCard";
import { deals, formatKzt, profile } from "@/lib/birge-content";
import { getMlTrustScore } from "@/lib/ml-api";

export default async function ProfilePage() {
  const mlTrust = await getMlTrustScore();
  const trustScore = mlTrust?.trust_score ?? profile.trustScore;
  const trustDecision = mlTrust?.decision ?? "allow";
  const activeDeals = deals.slice(0, 3);
  const closedDeals = deals.slice(8, 11);

  return (
    <div className="bg-white">
      <BannerStrip />
      <SiteHeader />
      <main className="max-w-[1440px] mx-auto px-[24px] py-[56px]">
        <section className="grid gap-[32px] lg:grid-cols-[1fr_2fr]">
          <ProfileIdentitySummary
            fallback={{
              name: profile.name,
              city: profile.city,
              budgetBand: profile.budgetBand,
            }}
            interests={profile.interests}
          />
          <dl className="grid grid-cols-2 gap-[12px] lg:grid-cols-4">
            {[
              ["Trust Score", `${trustScore}/100`],
              ["Active deals", String(profile.activeDeals)],
              ["Closed deals", String(profile.closedDeals)],
              ["Saved money", formatKzt(profile.savedMoney)],
            ].map(([label, value]) => (
              <div key={label} className="border border-ff-hairline p-[18px]">
                <dt className="text-[13px] leading-[17px] text-ff-gray-text">
                  {label}
                </dt>
                <dd className="mt-[6px] text-[22px] leading-[28px] font-bold">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid gap-[12px] pt-[28px] lg:grid-cols-2">
          <article className="border border-ff-hairline p-[18px]">
            <p className="text-[13px] leading-[17px] text-ff-gray-text">
              Payment method
            </p>
            <h2 className="mt-[6px] text-[22px] leading-[28px] font-bold">
              Kaspi mock
            </h2>
            <p className="mt-[8px] text-[15px] leading-5 text-ff-gray-text">
              Оплата удерживается в эскроу до сбора группы. Если группа не
              собралась, Birge показывает авто-возврат.
            </p>
          </article>
          <article className="border border-ff-hairline p-[18px]">
            <p className="text-[13px] leading-[17px] text-ff-gray-text">
              Security status
            </p>
            <h2 className="mt-[6px] text-[22px] leading-[28px] font-bold">
              1 SIM = 1 место · {trustDecision}
            </h2>
            <p className="mt-[8px] text-[15px] leading-5 text-ff-gray-text">
              {mlTrust?.level_2_story ??
                "Trust Score растёт после закрытых сделок, подтверждённых оплат и отсутствия дубликатов устройства."}
            </p>
          </article>
        </section>

        {/* Telecom identity panel */}
        <section className="pt-[28px]">
          <TelecomProfileCard />
        </section>

        <section className="pt-[56px]">
          <div className="grid grid-cols-[1fr_auto] gap-[12px] items-end">
            <h2 className="text-[22px] leading-[28px] font-normal">
              Active deals
            </h2>
            <Link
              href="/#deals"
              className="flex h-[32px] items-center justify-center border border-[rgb(34,34,34)] px-[16px] text-[15px] font-bold"
            >
              Browse
            </Link>
          </div>
          <div className="mt-[24px] grid gap-[12px] lg:grid-cols-3">
            {activeDeals.map((deal) => (
              <article key={deal.id} className="grid grid-cols-[112px_1fr] gap-[14px] border border-ff-hairline p-[12px]">
                <DealVisual deal={deal} className="aspect-[3/4] w-full" compact />
                <div>
                  <p className="text-[13px] leading-[17px] text-ff-gray-text">
                    {deal.city} · {deal.participants}/{deal.target}
                  </p>
                  <h3 className="mt-[4px] text-[15px] leading-5 font-bold">
                    {deal.titleRu}
                  </h3>
                  <p className="mt-[8px] text-[18px] leading-[24px] font-bold">
                    {formatKzt(deal.finalPrice)}
                  </p>
                  <p className="mt-[4px] text-[13px] leading-[17px] text-[#007f67] font-bold">
                    1 SIM = 1 место
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="pt-[56px]">
          <h2 className="text-[22px] leading-[28px] font-normal">
            Closed deals
          </h2>
          <div className="mt-[24px] grid gap-[12px] lg:grid-cols-3">
            {closedDeals.map((deal) => (
              <article key={deal.id} className="grid grid-cols-[112px_1fr] gap-[14px] border border-ff-hairline p-[12px]">
                <DealVisual deal={deal} className="aspect-[3/4] w-full" compact />
                <div>
                  <p className="text-[13px] leading-[17px] text-ff-gray-text">
                    Closed · {deal.city}
                  </p>
                  <h3 className="mt-[4px] text-[15px] leading-5 font-bold">
                    {deal.titleRu}
                  </h3>
                  <p className="mt-[8px] text-[18px] leading-[24px] font-bold">
                    Saved {formatKzt(deal.savingsAmount)}
                  </p>
                  <p className="mt-[4px] text-[13px] leading-[17px] text-[#007f67] font-bold">
                    SIM verified group
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
