import type { TrendingContent } from "@/types/farfetch";

export function TrendingTiles({ content }: { content: TrendingContent }) {
  return (
    <section>
      <div className="max-w-[1440px] mx-auto px-[24px]">
        <h2 className="text-[22px] leading-[28px] font-normal text-center mt-[48px]">
          {content.heading}
        </h2>

        {/* Desktop: 4-column grid; tablet: 2-column grid; mobile: horizontal scroll rail */}
        <div className="pt-[48px] pb-[24px]">
          {/* Mobile rail (< 480px) */}
          <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-[12px] min-[480px]:hidden">
            {content.tiles.map((tile) => (
              <a
                key={tile.href}
                href={tile.href}
                className="group shrink-0 w-[280px] snap-start"
              >
                <img
                  src={tile.image}
                  alt={tile.title}
                  className="w-full aspect-[3/4] object-cover"
                />
                <div className="mt-[24px] text-[15px] leading-5 uppercase text-left text-[rgb(34,34,34)] group-hover:underline">
                  {tile.title}
                </div>
              </a>
            ))}
          </div>

          {/* Tablet: 2-column grid (480px–1023px) */}
          <div className="hidden min-[480px]:grid max-lg:grid-cols-2 min-[480px]:gap-[24px] lg:hidden">
            {content.tiles.map((tile) => (
              <article key={tile.href} className="mb-[24px]">
                <a href={tile.href} className="group block">
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="mt-[24px] text-[15px] leading-5 uppercase text-left text-[rgb(34,34,34)] group-hover:underline">
                    {tile.title}
                  </div>
                </a>
              </article>
            ))}
          </div>

          {/* Desktop: 4-column grid (>= 1024px) */}
          <div className="hidden lg:grid grid-cols-4 gap-x-[24px]">
            {content.tiles.map((tile) => (
              <article key={tile.href} className="mb-[24px]">
                <a href={tile.href} className="group block">
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="mt-[24px] text-[15px] leading-5 uppercase text-left text-[rgb(34,34,34)] group-hover:underline">
                    {tile.title}
                  </div>
                </a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
