import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Keep these at module scope so Next can inline NEXT_PUBLIC_* values at build time.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  "";

let cached: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;

  // IMPORTANT: For Next static export, don't throw here; just return null and let UI fall back.
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  cached = createClient(SUPABASE_URL, SUPABASE_KEY);
  return cached;
}
