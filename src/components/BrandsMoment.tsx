import type { BrandsMomentContent } from "@/types/farfetch";

export function BrandsMoment({ content }: { content: BrandsMomentContent }) {
  return (
    <section className="pt-[48px] pb-[24px]">
      <div className="max-w-[1440px] mx-auto px-[24px]">
        <div className="flex flex-col gap-[36px]">
          <h2 className="text-[22px] leading-[28px] font-normal text-left">
            {content.heading}
          </h2>

          {/* Desktop: flex row; Mobile: horizontal scroll rail */}
          <div className="hidden lg:flex gap-[36px]">
            {content.tiles.map((tile) => (
              <a
                key={tile.href}
                href={tile.href}
                className="group flex-1"
              >
                <article className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 w-full p-[24px]">
                    <span className="text-[30px] leading-[38px] font-normal text-white text-left group-hover:underline block">
                      {tile.title}
                    </span>
                  </div>
                </article>
              </a>
            ))}
          </div>

          {/* Mobile/tablet: horizontal scroll rail (< 1024px) */}
          <div className="flex overflow-x-auto no-scrollbar snap-x gap-[36px] lg:hidden">
            {content.tiles.map((tile) => (
              <a
                key={tile.href}
                href={tile.href}
                className="group shrink-0 w-[min(85vw,440px)] snap-start"
              >
                <article className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 w-full p-[24px]">
                    <span className="text-[30px] leading-[38px] font-normal text-white text-left group-hover:underline block">
                      {tile.title}
                    </span>
                  </div>
                </article>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
