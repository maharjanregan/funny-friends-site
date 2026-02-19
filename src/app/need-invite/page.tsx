import { Nav } from "@/components/Nav";

export default function NeedInvitePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-50">
      <header className="mx-auto max-w-4xl px-6 pt-10">
        <Nav />
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 pt-12">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Need an invite?
        </h1>
        <p className="mt-4 text-lg text-zinc-700 dark:text-zinc-300">
          Pray everyday so you would get an invite.
        </p>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          (Or… DM Regan.)
        </p>
      </main>
    </div>
  );
}
