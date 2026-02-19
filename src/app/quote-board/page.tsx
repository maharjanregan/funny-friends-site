"use client";

import quotesData from "@/data/quotes.json";
import { pickDailyTop3, todayKey, type Quote } from "@/lib/quoteBoard";

export default function QuoteBoardPage() {
  const quotes = quotesData as Quote[];
  const key = todayKey("America/Los_Angeles");
  const top3 = pickDailyTop3(quotes, key);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-50">
      <header className="mx-auto max-w-4xl px-6 pt-10">
        <nav className="flex items-center justify-between">
          <a href="/" className="font-semibold tracking-tight">
            funny-friends
          </a>
          <div className="flex items-center gap-6 text-sm">
            <a className="hover:underline" href="/quote-board">
              Quote board
            </a>
            <a className="hover:underline" href="/input">
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
              Today’s top 3 (random, but consistent for the day)
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
