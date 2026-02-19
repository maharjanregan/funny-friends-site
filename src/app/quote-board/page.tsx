"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Nav } from "@/components/Nav";
import quotesData from "@/data/quotes.json";
import { todayKey as clientTodayKey, pickDailyTop3, type Quote } from "@/lib/quoteBoard";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { MessageRow } from "@/types/message";

type Mode = "supabase" | "fallback";

const PAGE_SIZE = 25;

export default function QuoteBoardPage() {
  const [mode, setMode] = useState<Mode>("supabase");
  const [loading, setLoading] = useState(true);

  // Chat-room state
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const oldestCreatedAt = useRef<string | null>(null);

  // Fallback (static quotes)
  const fallbackQuotes = quotesData as Quote[];
  const key = useMemo(() => clientTodayKey("America/Los_Angeles"), []);
  const fallbackTop3 = useMemo(
    () => pickDailyTop3(fallbackQuotes, key),
    [fallbackQuotes, key],
  );

  async function fetchLatest() {
    const supabase = getSupabase();
    if (!supabase) throw new Error("missing supabase config");

    const { data, error } = await supabase
      .from("messages")
      .select("id, friend, text, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) throw error;

    const rows = (data ?? []) as MessageRow[];
    setMessages(rows);
    oldestCreatedAt.current = rows.length ? rows[rows.length - 1]!.created_at : null;
    setHasMore(rows.length === PAGE_SIZE);
  }

  async function loadMore() {
    const supabase = getSupabase();
    if (!supabase) return;

    const cursor = oldestCreatedAt.current;
    if (!cursor) return;

    const { data, error } = await supabase
      .from("messages")
      .select("id, friend, text, image_url, created_at")
      .lt("created_at", cursor)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) return;

    const rows = (data ?? []) as MessageRow[];
    setMessages((prev) => [...prev, ...rows]);
    oldestCreatedAt.current = rows.length
      ? rows[rows.length - 1]!.created_at
      : oldestCreatedAt.current;
    setHasMore(rows.length === PAGE_SIZE);
  }

  // Initial load + realtime subscription
  useEffect(() => {
    let cancelled = false;
    let channel: any = null;

    async function boot() {
      setLoading(true);
      try {
        await fetchLatest();
        if (cancelled) return;
        setMode("supabase");

        const supabase = getSupabase();
        if (!supabase) return;

        channel = supabase
          .channel("messages-room")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages" },
            (payload: any) => {
              const m = payload.new as MessageRow;
              setMessages((prev) => {
                if (prev.some((x) => x.id === m.id)) return prev;
                return [m, ...prev];
              });
            },
          )
          .subscribe();
      } catch {
        if (!cancelled) setMode("fallback");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();

    return () => {
      cancelled = true;
      if (channel) {
        try {
          channel.unsubscribe();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const top3 =
    mode === "supabase" && messages.length
      ? messages.slice(0, 3).map((m, i) => ({
          id: m.id ?? `m-${i}`,
          text: m.text ?? "",
          saidBy: m.friend,
          tags: ["latest"],
        }))
      : fallbackTop3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-50">
      <header className="mx-auto max-w-4xl px-6 pt-10">
        <Nav />
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Room
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-300">
              Live feed (newest on top)
              {loading ? " — loading…" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-zinc-500 dark:text-zinc-400">Date:</span>{" "}
              <span className="font-mono">{key}</span>
            </div>
            <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-zinc-500 dark:text-zinc-400">Supabase:</span>{" "}
              <span className="font-mono">
                {isSupabaseConfigured() ? "configured" : "missing env"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick summary + leaderboard */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Today’s summary
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {mode === "supabase" ? messages.length : 0}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              total rants loaded
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Leaderboard
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {(["Rahul", "Dristant", "Shreni", "Regan"] as const).map((n) => {
                const count = messages.filter((m) => m.friend === n).length;
                return (
                  <div
                    key={n}
                    className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-black/40"
                  >
                    <span className="font-medium">{n}</span>
                    <span className="font-mono opacity-80">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Latest 3 highlight */}
        <section className="mt-8 grid gap-6">
          {top3.map((q, i) => (
            <article
              key={q.id}
              className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                Latest #{i + 1}
              </p>
              <p className="mt-3 text-xl leading-8">“{q.text}”</p>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
                — <span className="font-medium">{q.saidBy}</span>
              </p>
            </article>
          ))}
        </section>

        {/* Full feed */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">All rants</h2>
          <div className="mt-4 grid gap-4">
            {mode === "supabase" ? (
              messages.map((m) => (
                <article
                  key={m.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{m.friend}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                  {m.text ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                      {m.text}
                    </p>
                  ) : null}
                  {m.image_url ? (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.image_url} alt="meme" className="w-full" />
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                Supabase not ready — showing fallback quote board only.
              </div>
            )}

            {mode === "supabase" && hasMore ? (
              <button
                type="button"
                onClick={loadMore}
                className="mx-auto mt-2 inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-zinc-800 dark:bg-zinc-950"
              >
                Load older
              </button>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
