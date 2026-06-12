export function parseCountdownToSeconds(value: string): number {
  const parts = value.split(":").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [h, m, s] = parts;
  return h * 3600 + m * 60 + s;
}

export function formatDuration(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function getRemainingSeconds(deadlineAt: string | Date): number {
  const ms = new Date(deadlineAt).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
}
