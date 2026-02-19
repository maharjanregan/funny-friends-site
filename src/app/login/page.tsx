"use client";

import { useState } from "react";

import { Nav } from "@/components/Nav";
import { getSupabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (!email.trim()) {
      setError("Enter your email.");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase isn’t ready yet. Try refreshing.");
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          // Always send users back to the public GitHub Pages URL (avoid localhost).
          emailRedirectTo:
            "https://maharjanregan.github.io/funny-friends-site/quote", 
        },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setStatus("Magic link sent. Check your email.");
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
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          Enter your email and we’ll send you a magic link.
        </p>

        <form
          onSubmit={sendMagicLink}
          className="mt-8 max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <label className="grid gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Email
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black/40"
            />
          </label>

          {error ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          {status ? (
            <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
              {status}
            </p>
          ) : null}

          <div className="mt-5">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
