"use client";

import { useMemo, useState } from "react";

import friendPins from "@/data/friendPins.json";
import { getSupabase } from "@/lib/supabaseClient";
import type { MessageRow } from "@/types/message";

type FriendName = keyof typeof friendPins;

function isValidPin(friend: FriendName, pin: string) {
  return pin.trim() === friendPins[friend];
}

export function PostComposer({ onPosted }: { onPosted?: () => void }) {
  const friends = useMemo(() => Object.keys(friendPins) as FriendName[], []);

  const [friend, setFriend] = useState<FriendName>(friends[0]);
  const [pin, setPin] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase isn’t ready yet. Try refreshing.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      setError("Login required to post.");
      return;
    }

    if (!text.trim() && !file) {
      setError("Add a rant or attach a meme.");
      return;
    }

    if (pin.trim().length !== 4) {
      setError("Code must be 4 digits.");
      return;
    }

    if (!isValidPin(friend, pin)) {
      setError("Wrong code.");
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

      setPin("");
      setText("");
      setFile(null);
      onPosted?.();
    } finally {
      setSaving(false);
    }
  }

  return (
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
          rows={3}
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
      </label>

      {error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="mt-5">
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          disabled={saving || (!text.trim() && !file) || pin.trim().length !== 4}
        >
          {saving ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
