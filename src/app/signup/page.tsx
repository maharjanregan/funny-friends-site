"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Nav } from "@/components/Nav";
import { getSupabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase isn’t ready yet. Try refreshing.");
      return;
    }

    if (!username.trim() || !email.trim() || !password || !inviteCode.trim()) {
      setError("Fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      // Validate invite using an Edge Function (to avoid leaking invite list)
      const res = await fetch(
        "https://ezfjduymvofycegmhmiz.supabase.co/functions/v1/validate_invite",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            username: username.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
            inviteCode: inviteCode.trim(),
          }),
        },
      );

      if (!res.ok) {
        setError("Invite not valid.");
        return;
      }

      const { ok } = (await res.json()) as { ok?: boolean };
      if (!ok) {
        setError("Invite not valid.");
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Mark invite as used (Edge Function)
      await fetch(
        "https://ezfjduymvofycegmhmiz.supabase.co/functions/v1/use_invite",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            username: username.trim().toLowerCase(),
            email: email.trim().toLowerCase(),
            inviteCode: inviteCode.trim(),
          }),
        },
      );

      router.replace("/quote");
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
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Signup</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          Invite-only.
        </p>

        <form
          onSubmit={onSignup}
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

          <label className="mt-4 grid gap-2">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Invite code
            </span>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="INVITE-XXXX"
              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black/40"
            />
          </label>

          {error ? (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <div className="mt-5">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              {loading ? "Signing up…" : "Signup"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account? <a className="underline" href="/login">Login</a>.
        </p>
      </main>
    </div>
  );
}
