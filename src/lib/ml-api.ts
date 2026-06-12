import type { Deal } from "@/types/birge";
import type { StoredBirgeProfile } from "@/lib/kz-options";

export function getMlBaseUrl() {
  return process.env.NEXT_PUBLIC_ML_API_URL || "http://127.0.0.1:8011";
}

export const demoMlUser = {
  id: "00000000-0000-0000-0000-000000000001",
  city: "Алматы",
  budget_band: "MID",
  interests: ["электроника", "гаджеты", "дом", "красота", "кухня"],
};

type MlUserProfile = typeof demoMlUser & {
  interest_weights?: Record<string, number>;
  budgetMin?: number;
  budgetMax?: number;
};

type MlRecommendation = {
  deal_id: string;
  product_id: string;
  score: number;
  components: {
    interest_match: number;
    budget_fit: number;
    city_match: number;
    momentum: number;
  };
  why: string[];
  explanation_ru: string;
  frontend: {
    score_label: string;
    reason_label: string;
    momentum_label: string;
  };
};

type MlRecommendationsResponse = {
  success: boolean;
  recommendations: MlRecommendation[];
};

type MlTrustScoreResponse = {
  success: boolean;
  trust_score: number;
  decision: "allow" | "step_up" | "block";
  components: Record<string, number>;
  signals: Record<string, unknown>;
  reasons: string[];
  level_2_story: string;
};

type MlEventType = "view" | "click" | "join" | "share" | "purchase_mock";

export type MlEventPayload = {
  user_id: string;
  event_type: MlEventType;
  deal_id: string;
  product_id: string;
  category: Deal["category"];
  metadata: Record<string, unknown>;
};

function fetchTimeout(ms: number) {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function toMlDeal(deal: Deal) {
  return {
    deal_id: deal.id,
    product_id: deal.id,
    title_ru: deal.titleRu,
    title_kk: deal.titleKz,
    category: deal.category,
    tags: [deal.category, deal.categoryLabel, ...deal.recommendation.split(" · ")],
    city: deal.city,
    retail_price_kzt: deal.retailPrice,
    group_price_kzt: deal.finalPrice,
    current_participants: deal.participants,
    target_participants: deal.target,
    discount_percent: deal.discount,
    tiers: deal.tiers.map((tier) => ({
      min_participants: tier.people,
      discount: tier.discount / 100,
      status: tier.status,
    })),
    image_url: deal.image,
  };
}

function applyMlRecommendation(deal: Deal, recommendation: MlRecommendation): Deal {
  return {
    ...deal,
    recommendation: recommendation.frontend.reason_label || recommendation.why.join(" · "),
    recommendationSignals: {
      interestMatch: recommendation.components.interest_match,
      budgetFit: recommendation.components.budget_fit,
      cityMatch: recommendation.components.city_match,
      momentum: recommendation.components.momentum,
      score: recommendation.score,
    },
  };
}

export async function rankDealsWithMl(
  userProfile: MlUserProfile,
  deals: Deal[]
): Promise<Deal[] | null> {
  if (deals.length === 0) return deals;

  try {
    const response = await fetch(`${getMlBaseUrl()}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: userProfile,
        deals: deals.map(toMlDeal),
        limit: deals.length,
      }),
      cache: "no-store",
      signal: fetchTimeout(1800),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as MlRecommendationsResponse;
    if (!data.success || !Array.isArray(data.recommendations)) return null;

    const localById = new Map(deals.map((deal) => [deal.id, deal]));
    const rankedIds = new Set<string>();
    const ranked = data.recommendations
      .map((recommendation) => {
        const deal = localById.get(recommendation.deal_id) ?? localById.get(recommendation.product_id);
        if (deal) rankedIds.add(deal.id);
        return deal ? applyMlRecommendation(deal, recommendation) : null;
      })
      .filter((deal): deal is Deal => Boolean(deal));

    if (ranked.length === 0) return null;
    return [...ranked, ...deals.filter((deal) => !rankedIds.has(deal.id))];
  } catch {
    return null;
  }
}

export async function getMlRankedDeals(deals: Deal[]): Promise<Deal[] | null> {
  return rankDealsWithMl(demoMlUser, deals);
}

export function getStoredMlUserProfile(): MlUserProfile {
  if (typeof window === "undefined") return demoMlUser;

  try {
    const raw = window.localStorage.getItem("birge_profile");
    if (!raw) return demoMlUser;

    const stored = JSON.parse(raw) as Partial<StoredBirgeProfile>;
    return {
      ...demoMlUser,
      city:
        typeof stored.city === "string" && stored.city.length > 0
          ? stored.city
          : demoMlUser.city,
      budget_band:
        typeof stored.budgetBand === "string" && stored.budgetBand.length > 0
          ? stored.budgetBand
          : demoMlUser.budget_band,
      budgetMin:
        typeof stored.budgetMin === "number" ? stored.budgetMin : undefined,
      budgetMax:
        typeof stored.budgetMax === "number" ? stored.budgetMax : undefined,
    };
  } catch {
    return demoMlUser;
  }
}

export async function getMlTrustScore(userId = demoMlUser.id): Promise<MlTrustScoreResponse | null> {
  try {
    const response = await fetch(`${getMlBaseUrl()}/trust-score?user_id=${encodeURIComponent(userId)}`, {
      cache: "no-store",
      signal: fetchTimeout(1200),
    });

    if (!response.ok) return null;
    return (await response.json()) as MlTrustScoreResponse;
  } catch {
    return null;
  }
}

export function logMlEvent({
  deal,
  eventType,
  metadata,
}: {
  deal: Deal;
  eventType: MlEventType;
  metadata?: Record<string, unknown>;
}) {
  const payload: MlEventPayload = {
    user_id: demoMlUser.id,
    event_type: eventType,
    deal_id: deal.id,
    product_id: deal.id,
    category: deal.category,
    metadata: {
      timestamp: new Date().toISOString(),
      ...(metadata ?? {}),
    },
  };

  void fetch("/api/ml-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // ML event logging is non-blocking; UI must keep working offline.
  });
}
