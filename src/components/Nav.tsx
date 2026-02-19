"use client";

import Link from "next/link";

import { useUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabaseClient";

export function Nav() {
  const { user } = useUser();

  return (
    <nav className="flex items-center justify-between">
      <Link href="/quote" className="font-semibold tracking-tight">
        rant-buddies
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link className="hover:underline" href="/quote">
          Room
        </Link>
        <Link className="hover:underline" href="/input">
          Rant
        </Link>
        {user ? (
          <button
            type="button"
            className="hover:underline"
            onClick={async () => {
              const supabase = getSupabase();
              await supabase?.auth.signOut();
            }}
          >
            Logout
          </button>
        ) : (
          <Link className="hover:underline" href="/login">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
