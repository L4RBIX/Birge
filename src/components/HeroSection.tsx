import Image from "next/image";
import Link from "next/link";
import { hero, stats } from "@/lib/birge-content";

const heroProducts = [
  {
    label: "Headphones",
    src: "/images/products/headphones.jpg",
    className: "left-[5%] top-[9%] w-[31%] rotate-[-3deg]",
  },
  {
    label: "Power bank",
    src: "/images/products/power-bank.jpg",
    className: "right-[5%] top-[13%] w-[28%] rotate-[4deg]",
  },
  {
    label: "Skincare",
    src: "/images/products/skincare-set.jpg",
    className: "left-[3%] bottom-[19%] w-[28%] rotate-[2deg]",
  },
  {
    label: "Kids tablet",
    src: "/images/products/kids-tablet.jpg",
    className: "right-[3%] bottom-[22%] w-[30%] rotate-[-4deg]",
  },
  {
    label: "Car compressor",
    src: "/images/products/tire-inflator.jpg",
    className: "left-[34%] bottom-[5%] w-[27%] rotate-[-2deg]",
  },
] as const;

function HeroProductTile({
  label,
  src,
  className,
}: {
  label: string;
  src: string;
  className: string;
}) {
  return (
    <div
      className={`absolute aspect-[4/5] border border-ff-hairline bg-white/90 p-[8px] opacity-75 shadow-[0_18px_40px_rgba(0,0,0,0.07)] transition-transform duration-300 ease-out hover:translate-y-[-4px] hover:opacity-100 motion-reduce:transition-none max-[479px]:p-[6px] ${className}`}
    >
      <div className="relative h-full w-full overflow-hidden bg-[rgb(246,246,246)]">
        <Image
          src={src}
          alt={label}
          fill
          sizes="(min-width: 1024px) 190px, 31vw"
          className="object-contain p-[8px]"
        />
      </div>
    </div>
  );
}

function HeroMarketplaceCollage() {
  return (
    <div
      role="img"
      aria-label="Birge group-buying marketplace with SIM verified deal"
      className="relative isolate w-full aspect-[3/4] overflow-hidden bg-[rgb(247,247,247)] lg:w-[684px] lg:h-[912px]"
    >
      <div className="absolute inset-[7%] border border-white/80 bg-white/55" />

      {/* marketplace parcels */}
      <div className="absolute right-[18%] bottom-[9%] h-[13%] w-[20%] rotate-[5deg] border border-[rgb(210,210,210)] bg-[#f2eee7] shadow-[0_18px_34px_rgba(0,0,0,0.08)]">
        <div className="absolute left-1/2 top-0 h-full w-[1px] bg-[rgb(210,210,210)]" />
        <div className="absolute left-[18%] top-[18%] h-[14%] w-[46%] border border-[rgb(180,180,180)] bg-white/60" />
      </div>
      <div className="absolute left-[18%] bottom-[8%] h-[9%] w-[14%] rotate-[-7deg] border border-[rgb(215,215,215)] bg-[#f7f4ee]" />

      {heroProducts.map((product) => (
        <HeroProductTile key={product.label} {...product} />
      ))}

      {/* central phone */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <Image
          src="/images/hero/birge-iphone-mockup.png"
          alt="Birge group-buying deal displayed on iPhone mockup"
          width={1920}
          height={1440}
          priority
          sizes="(min-width: 1024px) 980px, 115vw"
          className="h-auto w-[220%] max-w-none scale-[1.24] object-contain drop-shadow-[0_34px_48px_rgba(0,0,0,0.20)] max-[479px]:w-[232%] max-[479px]:scale-[1.18]"
        />
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="w-full bg-white">
      {/* Desktop: 2-column grid; mobile: stacked */}
      <div className="max-w-[1440px] mx-auto px-[24px]">
        {/* Mobile: image on top, text below */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-center lg:py-[48px]">

          {/* Image column — right on desktop, top on mobile */}
          <div className="order-first lg:order-last lg:flex lg:justify-end">
            <HeroMarketplaceCollage />
          </div>

          {/* Text column — left on desktop, bottom on mobile */}
          <div className="order-last lg:order-first py-[24px] lg:py-0">
            <div className="max-w-[588px] mx-auto text-center">
              <h1
                className="
                  font-normal
                  text-[28px] leading-[36px]
                  sm:text-[38px] sm:leading-[48px]
                  text-[rgb(34,34,34)]
                "
              >
                {hero.title}
              </h1>
              <p
                className="
                  mt-[16px]
                  font-normal
                  text-[15px] leading-5
                  sm:text-[20px] sm:leading-[24px]
                  text-[rgb(34,34,34)]
                "
              >
                {hero.body}
              </p>
              <Link
                href={hero.ctaHref}
                className="
                  inline-flex items-center justify-center
                  mt-[24px]
                  h-[44px] min-w-[44px]
                  px-[16px] py-[10px]
                  text-[15px] font-bold
                  text-[rgb(34,34,34)] bg-white
                  border border-[rgb(34,34,34)]
                  ff-transition
                  hover:bg-[rgb(34,34,34)] hover:text-white
                "
              >
                {hero.ctaLabel}
              </Link>
              <Link
                href={hero.secondaryCtaHref}
                className="
                  inline-flex items-center justify-center
                  mt-[24px] ml-[12px]
                  h-[44px] min-w-[44px]
                  px-[16px] py-[10px]
                  text-[15px] font-bold
                  text-[#007f67] bg-white
                  border border-[#007f67]
                  ff-transition
                  hover:bg-[#007f67] hover:text-white
                  max-[479px]:ml-0 max-[479px]:mt-[12px]
                "
              >
                {hero.secondaryCtaLabel}
              </Link>
              <p className="mt-[18px] text-[15px] leading-5 font-bold text-[#007f67]">
                Собери группу — получи опт.
              </p>
            </div>
          </div>

        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-[24px] pb-[24px]">
        <dl className="grid grid-cols-2 lg:grid-cols-4 border-y border-ff-hairline">
          {stats.map((stat) => (
            <div
              key={stat.value}
              className="py-[18px] pr-[16px] border-b border-ff-hairline odd:border-r lg:border-b-0 lg:border-r last:border-r-0"
            >
              <dt className="text-[22px] leading-[28px] font-bold text-[rgb(34,34,34)]">
                {stat.value}
              </dt>
              <dd className="mt-[4px] text-[13px] leading-[17px] text-ff-gray-text">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
