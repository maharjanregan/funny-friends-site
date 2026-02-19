import Link from "next/link";

export function Nav() {
  return (
    <nav className="flex items-center justify-between">
      <Link href="/quote" className="font-semibold tracking-tight">
        funny-friends
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link className="hover:underline" href="/quote">
          Quote board
        </Link>
        <Link className="hover:underline" href="/input">
          Rant
        </Link>
      </div>
    </nav>
  );
}
