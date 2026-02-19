"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { getSupabase } from "@/lib/supabaseClient";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function bootstrap() {
      // Handle magic-link flows that land with tokens in the URL hash.
      // Example: http(s)://.../#access_token=...&refresh_token=...
      if (typeof window !== "undefined" && window.location.hash.includes("access_token=")) {
        const hash = window.location.hash.replace(/^#/, "");
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          await supabase!.auth.setSession({ access_token, refresh_token });
        }

        // Clean up the URL (prevents re-processing on refresh)
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const { data } = await supabase!.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    }

    void bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
