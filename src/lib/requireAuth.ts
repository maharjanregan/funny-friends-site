"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useUser } from "@/lib/auth";

export function useRequireAuth(defaultNext = "/quote") {
  const { user, loading } = useUser();
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    if (loading) return;
    if (user) return;

    const next = sp.get("next") ?? defaultNext;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [loading, user, router, sp, defaultNext]);

  return { user, loading };
}
