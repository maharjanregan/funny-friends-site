"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Nav } from "@/components/Nav";
import { ForgotPin } from "@/components/ForgotPin";
import { PostComposer } from "@/components/PostComposer";
import friendPins from "@/data/friendPins.json";
import quotesData from "@/data/quotes.json";
import { todayKey as clientTodayKey, pickDailyTop3, type Quote } from "@/lib/quoteBoard";
import { getSupabase } from "@/lib/supabaseClient";
import type { MessageRow } from "@/types/message";
import type { ReplyRow } from "@/types/reply";

type Mode = "supabase" | "fallback";

type FriendName = keyof typeof friendPins;

const PAGE_SIZE = 25;

function isValidPin(friend: FriendName, pin: string) {
  return pin.trim() === friendPins[friend];
}

export default function QuoteBoardPage() {
  const [mode, setMode] = useState<Mode>("supabase");
  const [loading, setLoading] = useState(true);

  // Chat-room state
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const oldestCreatedAt = useRef<string | null>(null);

  // Replies
  const [repliesByMessage, setRepliesByMessage] = useState<Record<string, ReplyRow[]>>({});
  const [replyFriendByMessage, setReplyFriendByMessage] = useState<Record<string, FriendName>>({});
  const [replyPinByMessage, setReplyPinByMessage] = useState<Record<string, string>>({});
  const [replyTextByMessage, setReplyTextByMessage] = useState<Record<string, string>>({});
  const [replyErrorByMessage, setReplyErrorByMessage] = useState<Record<string, string | null>>({});
  const [replyPostingByMessage, setReplyPostingByMessage] = useState<Record<string, boolean>>({});

  const friends = useMemo(() => Object.keys(friendPins) as FriendName[], []);

  // Fallback (static quotes)
  const fallbackQuotes = quotesData as Quote[];
  const key = useMemo(() => clientTodayKey("America/Los_Angeles"), []);
  const fallbackTop3 = useMemo(
    () => pickDailyTop3(fallbackQuotes, key),
    [fallbackQuotes, key],
  );

  async function fetchRepliesFor(messageIds: string[]) {
    const supabase = getSupabase();
    if (!supabase) return;
    if (!messageIds.length) return;

    const { data, error } = await supabase
      .from("replies")
      .select("id, message_id, friend, text, created_at")
      .in("message_id", messageIds)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) return;

    const rows = (data ?? []) as ReplyRow[];
    const grouped: Record<string, ReplyRow[]> = {};
    for (const r of rows) {
      (grouped[r.message_id] ||= []).push(r);
    }

    setRepliesByMessage((prev) => ({ ...prev, ...grouped }));
  }

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

    await fetchRepliesFor(rows.map((r) => r.id));
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

    await fetchRepliesFor(rows.map((r) => r.id));
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
          .channel("room")
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
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "replies" },
            (payload: any) => {
              const r = payload.new as ReplyRow;
              setRepliesByMessage((prev) => {
                const cur = prev[r.message_id] ?? [];
                if (cur.some((x) => x.id === r.id)) return prev;
                return { ...prev, [r.message_id]: [...cur, r] };
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

  const latest3 =
    mode === "supabase" && messages.length
      ? messages.slice(0, 3).map((m, i) => ({
          id: m.id ?? `m-${i}`,
          text: m.text ?? "",
          saidBy: m.friend,
          tags: ["latest"],
        }))
      : fallbackTop3;

  async function postReply(messageId: string) {
    const supabase = getSupabase();
    if (!supabase) {
      setReplyErrorByMessage((p) => ({ ...p, [messageId]: "Supabase not ready." }));
      return;
    }

    const friend = (replyFriendByMessage[messageId] ?? friends[0]) as FriendName;
    const pin = replyPinByMessage[messageId] ?? "";
    const text = (replyTextByMessage[messageId] ?? "").trim();

    setReplyErrorByMessage((p) => ({ ...p, [messageId]: null }));

    if (!text) {
      setReplyErrorByMessage((p) => ({ ...p, [messageId]: "Write a reply first." }));
      return;
    }

    if (pin.trim().length !== 4) {
      setReplyErrorByMessage((p) => ({ ...p, [messageId]: "Code must be 4 digits." }));
      return;
    }

    if (!isValidPin(friend, pin)) {
      setReplyErrorByMessage((p) => ({ ...p, [messageId]: "Wrong code." }));
      return;
    }

    setReplyPostingByMessage((p) => ({ ...p, [messageId]: true }));
    try {
      const { error } = await supabase.from("replies").insert({
        message_id: messageId,
        friend,
        text,
      });

      if (error) {
        setReplyErrorByMessage((p) => ({ ...p, [messageId]: error.message }));
        return;
      }

      setReplyPinByMessage((p) => ({ ...p, [messageId]: "" }));
      setReplyTextByMessage((p) => ({ ...p, [messageId]: "" }));
    } finally {
      setReplyPostingByMessage((p) => ({ ...p, [messageId]: false }));
    }
  }

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
              Shared chat room — newest on top
              {loading ? " — loading…" : ""}
            </p>
          </div>
          <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <span className="text-zinc-500 dark:text-zinc-400">Date:</span>{" "}
            <span className="font-mono">{key}</span>
          </div>
        </div>

        <section className="mt-6">
          <ForgotPin />
        </section>

        <section className="mt-6">
          <PostComposer onPosted={() => {}} />
        </section>

        {/* Summary + leaderboard */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Summary
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {mode === "supabase" ? messages.length : 0}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              messages loaded
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

        {/* Latest highlight */}
        <section className="mt-8 grid gap-6">
          {latest3.map((q, i) => (
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

        {/* Full feed w/ threaded replies */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Feed</h2>

          {mode !== "supabase" ? (
            <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
              Supabase not ready — showing fallback quotes only.
            </div>
          ) : null}

          <div className="mt-4 grid gap-4">
            {mode === "supabase"
              ? messages.map((m) => {
                  const replies = repliesByMessage[m.id] ?? [];
                  const replyFriend =
                    (replyFriendByMessage[m.id] as FriendName | undefined) ??
                    friends[0];
                  const replyPin = replyPinByMessage[m.id] ?? "";
                  const replyText = replyTextByMessage[m.id] ?? "";
                  const posting = replyPostingByMessage[m.id] ?? false;
                  const rerr = replyErrorByMessage[m.id] ?? null;

                  return (
                    <article
                      key={m.id}
                      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{m.friend}</p>
                        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
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

                      {/* Replies */}
                      <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-black/40">
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          Replies ({replies.length})
                        </p>

                        {replies.length ? (
                          <div className="mt-3 grid gap-2">
                            {replies.map((r) => (
                              <div
                                key={r.id}
                                className="rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold">
                                    {r.friend}
                                  </span>
                                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                                    {new Date(r.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                                  {r.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                            No replies yet.
                          </p>
                        )}

                        {/* Reply composer */}
                        <div className="mt-4 grid gap-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="grid gap-1">
                              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                Friend
                              </span>
                              <select
                                value={replyFriend}
                                onChange={(e) =>
                                  setReplyFriendByMessage((p) => ({
                                    ...p,
                                    [m.id]: e.target.value as FriendName,
                                  }))
                                }
                                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                              >
                                {friends.map((f) => (
                                  <option key={f} value={f}>
                                    {f}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="grid gap-1">
                              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                4-digit code
                              </span>
                              <input
                                value={replyPin}
                                onChange={(e) => {
                                  const next = e.target.value.replace(/\D/g, "").slice(0, 4);
                                  setReplyPinByMessage((p) => ({ ...p, [m.id]: next }));
                                }}
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="••••"
                                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                              />
                            </label>
                          </div>

                          <label className="grid gap-1">
                            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              Reply
                            </span>
                            <textarea
                              value={replyText}
                              onChange={(e) =>
                                setReplyTextByMessage((p) => ({
                                  ...p,
                                  [m.id]: e.target.value,
                                }))
                              }
                              rows={2}
                              placeholder="Write a reply…"
                              className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950"
                            />
                          </label>

                          {rerr ? (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {rerr}
                            </p>
                          ) : null}

                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => postReply(m.id)}
                              className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                              disabled={posting || !replyText.trim() || replyPin.trim().length !== 4}
                            >
                              {posting ? "Posting…" : "Reply"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })
              : null}

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
