import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Accept either common naming convention.
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // IMPORTANT: For Next static export, modules can be evaluated at build time.
  // Don't throw here; just return null and let the UI fall back.
  if (!supabaseUrl || !supabaseAnonKey) return null;

  cached = createClient(supabaseUrl, supabaseAnonKey);
  return cached;
}
