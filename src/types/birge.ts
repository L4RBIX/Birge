export type DealCategory =
  | "electronics"
  | "home"
  | "beauty"
  | "sport"
  | "kids"
  | "auto"
  | "fashion";

export interface PriceTier {
  people: number;
  discount: number;
  status: "unlocked" | "current" | "locked";
}

export interface Deal {
  id: string;
  category: DealCategory;
  categoryLabel: string;
  titleRu: string;
  titleKz: string;
  description: string;
  image: string;
  image480: string;
  visual: "photo";
  visualTone: string;
  city: "Алматы" | "Астана";
  source: "AliExpress" | "1688" | "Amazon" | "Temu mock";
  retailPrice: number;
  groupPrice: number;
  cargoCost: number;
  finalPrice: number;
  discount: number;
  participants: number;
  target: number;
  countdown: string;
  recommendation: string;
  recommendationSignals: {
    interestMatch: number;
    budgetFit: number;
    cityMatch: number;
    momentum: number;
    score: number;
  };
  tiers: PriceTier[];
  escrowNotes: string[];
  savingsAmount: number;
  href: string;
}

export interface Profile {
  name: string;
  city: string;
  interests: string[];
  budgetBand: string;
  trustScore: number;
  simVerified: boolean;
  activeDeals: number;
  closedDeals: number;
  savedMoney: number;
}
