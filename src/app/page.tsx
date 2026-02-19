type Social = {
  label: string;
  href: string;
};

type Friend = {
  name: string;
  vibe: string;
  highlights: string[];
  socials: Social[];
};

const friends: Friend[] = [
  {
    name: "Rahul",
    vibe: "Deadpan delivery. Somehow always the punchline and the narrator.",
    highlights: [
      "Accidental comedy genius",
      "Roasts with love (mostly)",
      "Never breaks character",
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "YouTube", href: "#" },
      { label: "TikTok", href: "#" },
    ],
  },
  {
    name: "Dristant",
    vibe: "High energy chaos. If there’s a bit, he’s already committed.",
    highlights: [
      "Physical comedy enthusiast",
      "Sound effects department",
      "Turns awkward into iconic",
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "YouTube", href: "#" },
      { label: "TikTok", href: "#" },
    ],
  },
  {
    name: "Shreni",
    vibe: "One-liners and perfect timing. The editor brain in human form.",
    highlights: [
      "Comedy sniper",
      "Meme-lore historian",
      "Laughs, then says the funniest thing",
    ],
    socials: [
      { label: "Instagram", href: "#" },
      { label: "YouTube", href: "#" },
      { label: "TikTok", href: "#" },
    ],
  },
];

function SocialLinks({ socials }: { socials: Social[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {socials.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target={s.href.startsWith("http") ? "_blank" : undefined}
          rel={s.href.startsWith("http") ? "noreferrer" : undefined}
          className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-medium text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        >
          {s.label}
        </a>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-50">
      <header className="mx-auto max-w-6xl px-6 pt-10">
        <nav className="flex items-center justify-between">
          <a href="#top" className="font-semibold tracking-tight">
            funny-friends
          </a>
          <div className="flex items-center gap-6 text-sm">
            <a className="hover:underline" href="/quote-board">
              Quote board
            </a>
            <a className="hover:underline" href="/input">
              Input
            </a>
            <a className="hover:underline" href="#friends">
              Friends
            </a>
            <a className="hover:underline" href="#about">
              About
            </a>
          </div>
        </nav>
      </header>

      <main id="top" className="mx-auto max-w-6xl px-6 pb-20 pt-14">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              New bits dropping whenever we feel like it
            </p>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Rahul. Dristant. Shreni.
              <span className="block text-zinc-600 dark:text-zinc-300">
                Three friends. Unlimited nonsense.
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">
              This is the official-ish home for the funniest moments, dumbest
              ideas, and highly questionable decisions made by three extremely
              online humans.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="#friends"
                className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Meet the trio
              </a>
              <a
                href="#about"
                className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white px-6 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-zinc-800 dark:bg-zinc-950"
              >
                What is this?
              </a>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Tip: replace the social links with real URLs when you’re ready.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Today’s forecast</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-black/40">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Probability of unhinged bit
                  </p>
                  <p className="mt-2 text-3xl font-semibold">93%</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-black/40">
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Chance of someone saying “bro”
                  </p>
                  <p className="mt-2 text-3xl font-semibold">100%</p>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                Drop a hero image/video later: <span className="font-mono">/public/hero.jpg</span>
              </div>
            </div>
          </div>
        </section>

        <section id="friends" className="mt-16">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                The friends
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                Click a link, follow the chaos.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {friends.map((f) => (
              <article
                key={f.name}
                className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">
                      {f.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                      {f.vibe}
                    </p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-zinc-100 text-lg font-semibold text-zinc-900 dark:bg-white/10 dark:text-zinc-50">
                    {f.name.slice(0, 1)}
                  </div>
                </div>

                <ul className="mt-5 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {f.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  <SocialLinks socials={f.socials} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="mt-16">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-2xl font-semibold tracking-tight">About</h2>
            <p className="mt-3 max-w-3xl leading-7 text-zinc-700 dark:text-zinc-300">
              This site is intentionally simple for v1: a shareable landing page
              with three profiles and social links. Next upgrades could be: a
              clips page, a highlights feed, or a “best of the week” section.
            </p>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Built with Next.js + Tailwind.
            </p>
          </div>
        </section>

        <footer className="mt-16 pb-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Made with questionable judgment and good timing.
        </footer>
      </main>
    </div>
  );
}
