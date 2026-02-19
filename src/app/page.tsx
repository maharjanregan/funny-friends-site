"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // This site is meant to start on the Quote Board.
    // Use a relative path so this works under GitHub Pages basePath.
    window.location.replace("quote-board");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-50">
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-20">
        <h1 className="text-2xl font-semibold tracking-tight">Redirecting…</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          Taking you to the quote board.
        </p>
        <p className="mt-4 text-sm">
          If you’re not redirected, go to{" "}
          <a className="underline" href="/quote-board">
            /quote-board
          </a>
          .
        </p>
      </main>
    </div>
  );
}
