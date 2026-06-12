export const KZ_CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Тараз",
  "Павлодар",
  "Усть-Каменогорск",
  "Семей",
  "Костанай",
  "Кызылорда",
  "Атырау",
  "Актау",
  "Уральск",
  "Туркестан",
  "Кокшетау",
] as const;

export const BUDGET_PRESETS = [
  "до 10 000 ₸",
  "10 000–50 000 ₸",
  "50 000+ ₸",
] as const;

export type KzCity = (typeof KZ_CITIES)[number];
export type BudgetPreset = (typeof BUDGET_PRESETS)[number];

export interface StoredBirgeProfile {
  name: string;
  age?: string;
  gender?: string;
  city: string;
  budgetBand: string;
  budgetMin?: number;
  budgetMax?: number;
}

export function formatKztNumber(value: number): string {
  return new Intl.NumberFormat("ru-KZ").format(value);
}

export function formatBudgetLabel({
  budgetBand,
  budgetMin,
  budgetMax,
}: {
  budgetBand: string;
  budgetMin?: number;
  budgetMax?: number;
}): string {
  if (typeof budgetMin === "number" && typeof budgetMax === "number") {
    return `${formatKztNumber(budgetMin)}–${formatKztNumber(budgetMax)} ₸`;
  }

  if (typeof budgetMax === "number") {
    return `до ${formatKztNumber(budgetMax)} ₸`;
  }

  if (typeof budgetMin === "number") {
    return `от ${formatKztNumber(budgetMin)} ₸`;
  }

  return budgetBand;
}

export function parseBudgetInput(value: string): number | undefined {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 0) return undefined;
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
