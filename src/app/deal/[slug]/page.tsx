import { notFound } from "next/navigation";
import { BannerStrip } from "@/components/BannerStrip";
import { DealDetail } from "@/components/DealDetail";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { deals, getDealById } from "@/lib/birge-content";

export function generateStaticParams() {
  return deals.map((deal) => ({ slug: deal.id }));
}

export default async function DealPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const deal = getDealById(slug);

  if (!deal) {
    notFound();
  }

  return (
    <div className="bg-white">
      <BannerStrip />
      <SiteHeader activeCategory={deal.category} />
      <main>
        <DealDetail deal={deal} />
      </main>
      <SiteFooter />
    </div>
  );
}
