"use client";

import { useEffect, useMemo, useState } from "react";

import quotesData from "@/data/quotes.json";
import { todayKey as clientTodayKey, pickDailyTop3, type Quote } from "@/lib/quoteBoard";
import { getSupabase } from "@/lib/supabaseClient";
import { todayKey } from "@/lib/dailyKey";
import type { QuoteSubmission } from "@/types/quoteSubmission";

type Mode = "supabase" | "fallback";

export default function QuoteBoardPage() {
  const [submissions, setSubmissions] = useState<QuoteSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("supabase");

  const fallbackQuotes = quotesData as Quote[];

  const key = useMemo(() => clientTodayKey("America/Los_Angeles"), []);
  const fallbackTop3 = useMemo(() => pickDailyTop3(fallbackQuotes, key), [fallbackQuotes, key]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const supabase = getSupabase();
        if (!supabase) throw new Error("missing supabase config");

        const dayKey = todayKey("America/Los_Angeles");
        const { data, error } = await supabase
          .from("quote_submissions")
          .select("id, friend, quote, day_key, created_at")
          .eq("day_key", dayKey)
          .order("created_at", { ascending: true })
          .limit(3);

        if (error) throw error;
        if (cancelled) return;

        setSubmissions((data ?? []) as QuoteSubmission[]);
        setMode("supabase");
      } catch {
        if (cancelled) return;
        setMode("fallback");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const top3 =
    mode === "supabase" && submissions.length
      ? submissions.map((s, i) => ({
          id: s.id ?? `s-${i}`,
          text: s.quote,
          saidBy: s.friend,
          tags: ["today"],
        }))
      : fallbackTop3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-50">
      <header className="mx-auto max-w-4xl px-6 pt-10">
        <nav className="flex items-center justify-between">
          <a href="/quote-board" className="font-semibold tracking-tight">
            funny-friends
          </a>
          <div className="flex items-center gap-6 text-sm">
            <a className="hover:underline" href="quote-board">
              Quote board
            </a>
            <a className="hover:underline" href="input">
              Input
            </a>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Quote board
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-300">
              Today’s top 3{mode === "supabase" ? " (live)" : " (random fallback)"}
              {loading ? " — loading…" : ""}
            </p>
          </div>
          <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <span className="text-zinc-500 dark:text-zinc-400">Date:</span>{" "}
            <span className="font-mono">{key}</span>
          </div>
        </div>

        <section className="mt-8 grid gap-6">
          {top3.map((q, i) => (
            <article
              key={q.id}
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                #{i + 1}
              </p>
              <p className="mt-3 text-xl leading-8">“{q.text}”</p>
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  — <span className="font-medium">{q.saidBy}</span>
                </p>
                {q.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {q.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-black/40 dark:text-zinc-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-6 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-black/20 dark:text-zinc-300">
          <p className="font-medium">How it works</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Quotes come from a JSON file in the repo.
            </li>
            <li>
              The site picks 3 quotes using a deterministic random seed based on the date.
            </li>
            <li>
              To add more quotes, edit <span className="font-mono">src/data/quotes.json</span> and push.
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
