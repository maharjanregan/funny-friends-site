"use client";

import { useMemo, useState } from "react";
import friendPins from "@/data/friendPins.json";

type FriendName = keyof typeof friendPins;

export function ForgotPin() {
  const friends = useMemo(() => Object.keys(friendPins) as FriendName[], []);
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
      >
        Forgot code?
      </button>

      {open ? (
        <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          <p className="font-semibold text-zinc-900 dark:text-zinc-50">Codes</p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            (Not secret — just a quick way to stop friends from posting as each other.)
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {friends.map((f) => (
              <li
                key={f}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-black/40"
              >
                <span className="font-medium">{f}</span>
                <span className="font-mono">{friendPins[f]}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
