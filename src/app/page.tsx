import { BannerStrip } from "@/components/BannerStrip";
import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { ProductRail } from "@/components/ProductRail";
import { DealDetail } from "@/components/DealDetail";
import { BirgeProofSections } from "@/components/BirgeProofSections";
import { SiteFooter } from "@/components/SiteFooter";
import { categoryNav, getDealRails, getDealsByCategory } from "@/lib/birge-content";
import { getMlRankedDeals } from "@/lib/ml-api";
import Link from "next/link";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params?.category ?? "all";
  const scopedDeals = getDealsByCategory(activeCategory);
  const mlRankedDeals = activeCategory === "all" ? await getMlRankedDeals(scopedDeals) : null;
  const dealRails = getDealRails(activeCategory, mlRankedDeals ?? undefined);
  const featuredDeal = dealRails[0]?.products[0];

  return (
    <div className="bg-white">
      <BannerStrip />
      <SiteHeader activeCategory={activeCategory} />
      <main>
        <HeroSection />
        <section className="max-w-[1440px] mx-auto px-[24px] pt-[24px]">
          <div className="flex gap-[8px] overflow-x-auto no-scrollbar border-y border-ff-hairline py-[12px]">
            {categoryNav.map((item) => (
              <Link
                key={item.value}
                href={item.href}
                className={
                  activeCategory === item.value
                    ? "flex h-[44px] shrink-0 items-center border border-[#007f67] px-[14px] text-[15px] font-bold text-[#007f67]"
                    : "flex h-[44px] shrink-0 items-center border border-ff-hairline px-[14px] text-[15px] font-bold text-[rgb(34,34,34)]"
                }
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
        {dealRails.map((rail) => (
          <ProductRail key={rail.heading} content={rail} />
        ))}
        {featuredDeal && <DealDetail deal={featuredDeal} />}
        <BirgeProofSections />
      </main>
      <SiteFooter />
    </div>
  );
}
