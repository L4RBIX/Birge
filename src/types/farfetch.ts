export interface Product {
  id: string;
  badge: string;
  brand: string;
  description: string;
  /** Display prices, pre-formatted (e.g. "$847"). */
  priceOriginal?: string;
  priceIntermediate?: string;
  priceFinal: string;
  /** Discount label shown under prices, e.g. "-10%". */
  discountLabel?: string;
  image: string;
  image480: string;
  href: string;
}

export interface ProductRailContent {
  /** Small intro line above the heading (optional). */
  intro?: string;
  heading: string;
  ctaLabel?: string;
  ctaHref?: string;
  products: Product[];
}

export interface PromoTile {
  title: string;
  href: string;
  image: string;
  /** Serif overlay title (split banners) vs caption-below (trending). */
  variant: "overlay" | "caption";
}

export interface SplitBannerContent {
  tiles: [PromoTile, PromoTile];
}

export interface TrendingContent {
  heading: string;
  tiles: PromoTile[];
}

export interface BrandsMomentContent {
  heading: string;
  tiles: PromoTile[];
}

export interface HeroContent {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
}

export interface NavColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface MegaMenuContent {
  columns: NavColumn[];
  spotlight?: {
    label: string;
    image: string;
    href: string;
  };
}

export interface NavItem {
  label: string;
  href: string;
  highlight?: boolean;
  menu?: MegaMenuContent;
}

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface HelpBarItem {
  icon: "hanger" | "question" | "bubble";
  title: string;
  body: string;
  href: string;
}
