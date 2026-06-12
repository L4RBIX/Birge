import type { SplitBannerContent } from "@/types/farfetch";

export function SplitBanner({ content }: { content: SplitBannerContent }) {
  return (
    <section className="pt-[48px] pb-[24px]">
      <div className="max-w-[1440px] mx-auto px-[24px]">
        <div className="flex gap-[24px] mb-[24px] max-lg:flex-col">
          {content.tiles.map((tile) => (
            <a
              key={tile.href}
              href={tile.href}
              className="flex-1"
            >
              <img
                src={tile.image}
                alt={tile.title}
                className="w-full aspect-[684/796] object-cover"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
