export type Quote = {
  id: string;
  text: string;
  saidBy: string;
  tags?: string[];
};

// Deterministic PRNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(s: string) {
  // Simple 32-bit hash
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function todayKey(tz = "America/Los_Angeles") {
  // For static export, we rely on the user's browser time.
  // We still use a timezone so the *same* user sees consistent results by locale.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === "year")?.value ?? "0000";
  const m = parts.find((p) => p.type === "month")?.value ?? "00";
  const d = parts.find((p) => p.type === "day")?.value ?? "00";

  return `${y}-${m}-${d}`;
}

export function pickDailyTop3(quotes: Quote[], key: string) {
  const n = Math.min(3, quotes.length);
  const rng = mulberry32(hashStringToSeed(`quote-board:${key}`));

  // Fisher–Yates shuffle indices deterministically
  const idx = quotes.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }

  return idx.slice(0, n).map((i) => quotes[i]);
}
