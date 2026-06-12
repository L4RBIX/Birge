import type { StoredBirgeProfile } from "@/lib/kz-options";

const STORAGE_KEY = "birge_profile";

export function getCurrentUser(): StoredBirgeProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredBirgeProfile>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.name !== "string" || !parsed.name.trim()) return null;
    if (typeof parsed.city !== "string" || !parsed.city.trim()) return null;
    return {
      name: parsed.name.trim(),
      city: parsed.city.trim(),
      budgetBand: typeof parsed.budgetBand === "string" ? parsed.budgetBand : "",
      age: typeof parsed.age === "string" ? parsed.age : undefined,
      gender: typeof parsed.gender === "string" ? parsed.gender : undefined,
      budgetMin: typeof parsed.budgetMin === "number" ? parsed.budgetMin : undefined,
      budgetMax: typeof parsed.budgetMax === "number" ? parsed.budgetMax : undefined,
      interests: Array.isArray(parsed.interests) ? (parsed.interests as string[]) : undefined,
    };
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: StoredBirgeProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function hasCurrentUser(): boolean {
  return getCurrentUser() !== null;
}
