"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Nav } from "@/components/Nav";
import { getSupabase } from "@/lib/supabaseClient";
import { usernameToEmail } from "@/lib/usernameLookup";

export function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase isn’t ready yet. Try refreshing.");
      return;
    }

    if (!username.trim() || !password) {
      setError("Enter username and password.");
      return;
    }

    setLoading(true);
    try {
      const email = await usernameToEmail(username);
      if (!email) {
        setError("Invalid credentials.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Invalid credentials.");
        return;
      }

      const next = sp.get("next") ?? "/quote";
      router.replace(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-50">
      <header className="mx-auto max-w-4xl px-6 pt-10">
        <Nav />
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-12">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Login</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">Log in to see the tea.</p>

        <form
          onSubmit={onLogin}
          className="mt-8 max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Username
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="rahul"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black/40"
            />
          </label>

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Password
            </span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black/40"
            />
          </label>

          {error ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {loading ? "Logging in…" : "Login"}
            </button>
            <a className="text-sm underline" href="/need-invite">
              Need an invite?
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}
