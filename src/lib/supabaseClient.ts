import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// NOTE: GitHub Pages static builds can be finicky about embedding env vars.
// We support BOTH:
// 1) build-time NEXT_PUBLIC_* env vars
// 2) runtime config injected via public/config.js: window.__FF_CONFIG__

const BUILD_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const BUILD_SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  "";

type RuntimeConfig = {
  supabaseUrl?: string;
  supabaseKey?: string;
  buildSha?: string;
};

function getRuntimeConfig(): RuntimeConfig {
  if (typeof window === "undefined") return {};
  return ((window as any).__FF_CONFIG__ as RuntimeConfig) ?? {};
}

let cached: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  const rc = getRuntimeConfig();
  const url = rc.supabaseUrl ?? BUILD_SUPABASE_URL;
  const key = rc.supabaseKey ?? BUILD_SUPABASE_KEY;
  return Boolean(url && key);
}

export const buildSha =
  (typeof window !== "undefined" ? getRuntimeConfig().buildSha : undefined) ??
  process.env.NEXT_PUBLIC_BUILD_SHA ??
  "";

export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;

  const rc = getRuntimeConfig();
  const url = rc.supabaseUrl ?? BUILD_SUPABASE_URL;
  const key = rc.supabaseKey ?? BUILD_SUPABASE_KEY;

  if (!url || !key) return null;

  cached = createClient(url, key);
  return cached;
}
