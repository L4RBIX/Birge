import { ProductCard } from "@/components/ProductCard";
import type { Deal } from "@/types/birge";

export function ProductRail({
  content,
}: {
  content: {
    heading: string;
    ctaLabel?: string;
    ctaHref?: string;
    products: Deal[];
  };
}) {
  return (
    <section
      id={content.heading === "Рекомендовано вам" ? "deals" : undefined}
      className="max-w-[1440px] mx-auto px-[24px] pt-[48px] pb-[24px]"
    >
      {/* Heading row */}
      <div className="grid grid-cols-[1fr_auto] gap-[12px] items-end">
        <h2 className="text-[22px] leading-[28px] font-normal text-[rgb(34,34,34)]">
          {content.heading}
        </h2>

        {content.ctaLabel && content.ctaHref && (
          <a
            href={content.ctaHref}
            className="flex items-center justify-center text-[15px] font-bold bg-white border border-[rgb(34,34,34)] px-[16px] py-[4px] h-[32px] hover:bg-[rgb(34,34,34)] hover:text-white ff-transition"
          >
            {content.ctaLabel}
          </a>
        )}
      </div>

      {/* Cards grid — desktop 4 cols, tablet 4 cols, mobile horizontal rail */}
      <div className="mt-[24px] flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-[12px] max-[479px]:flex sm:grid sm:grid-cols-4 sm:gap-x-[12px] sm:gap-y-[36px] sm:overflow-visible lg:gap-x-[16px]">
        {content.products.map((product) => (
          <div
            key={product.id}
            className="shrink-0 w-[249px] snap-start max-[479px]:block sm:w-auto"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
