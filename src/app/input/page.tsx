"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Nav } from "@/components/Nav";
import { ForgotPin } from "@/components/ForgotPin";
import friendPins from "@/data/friendPins.json";
import { getSupabase } from "@/lib/supabaseClient";
import type { MessageRow } from "@/types/message";

type FriendName = keyof typeof friendPins;

function isValidPin(friend: FriendName, pin: string) {
  return pin.trim() === friendPins[friend];
}

export default function InputPage() {
  const router = useRouter();
  const friends = useMemo(() => Object.keys(friendPins) as FriendName[], []);

  const [friend, setFriend] = useState<FriendName>(friends[0]);
  const [pin, setPin] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!text.trim() && !file) {
      setError("Add a rant or attach a meme.");
      return;
    }

    if (pin.trim().length !== 4) {
      setError("PIN must be 4 digits.");
      return;
    }

    if (!isValidPin(friend, pin)) {
      setError("Wrong code.");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase isn’t ready yet. Try refreshing.");
      return;
    }

    setSaving(true);
    try {
      let image_url: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop() || "png";
        const path = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("memes")
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined,
          });

        if (uploadError) {
          setError(uploadError.message);
          return;
        }

        const { data } = supabase.storage.from("memes").getPublicUrl(path);
        image_url = data.publicUrl;
      }

      const payload: Omit<MessageRow, "id" | "created_at"> = {
        friend,
        text: text.trim() ? text.trim() : null,
        image_url,
      };

      const { error: insertError } = await supabase.from("messages").insert(payload);

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setSubmitted(true);
      setPin("");
      setText("");
      setFile(null);

      setTimeout(() => {
        router.push("/quote");
      }, 300);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-50">
      <header className="mx-auto max-w-4xl px-6 pt-10">
        <Nav />
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-12">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Rant here
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          Pick your name, enter your 4-digit code, and rant.
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Buddies: Rahul · Dristant · Shreni · Regan
        </p>
        <ForgotPin />

        <div className="mt-8 grid gap-6">
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Friend
                </span>
                <select
                  value={friend}
                  onChange={(e) => setFriend(e.target.value as FriendName)}
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black/40"
                >
                  {friends.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  4-digit code
                </span>
                <input
                  value={pin}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setPin(next);
                  }}
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black/40"
                />
              </label>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Rant
              </span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder="Type your rant…"
                className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-sm shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-black/40"
              />
            </label>

            <label className="mt-4 grid gap-2">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Meme / picture (optional)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-zinc-800 dark:text-zinc-300 dark:file:bg-white dark:file:text-black dark:hover:file:bg-zinc-200"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tip: keep images under ~2MB for fast uploads.
              </p>
            </label>

            {error ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                disabled={saving || (!text.trim() && !file) || pin.trim().length !== 4}
              >
                {saving ? "Posting…" : "Post"}
              </button>
              <a
                href="/quote"
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-zinc-800 dark:bg-zinc-950"
              >
                View room →
              </a>
            </div>
          </form>

          {submitted ? (
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-100">
              <h2 className="text-lg font-semibold">Posted</h2>
              <p className="mt-2 text-sm opacity-90">
                Sending you to the room…
              </p>
              <div className="mt-4">
                <a
                  href="/quote"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-emerald-300 bg-white/70 px-5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow"
                >
                  Go to room →
                </a>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
