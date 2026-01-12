import Link from "next/link";
import { logoFont } from "@/lib/fonts";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/75 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link
          href="/"
          className={[
            logoFont.className,
            "text-[22px] font-extrabold tracking-tight text-zinc-950",
            "hover:opacity-80 transition",
          ].join(" ")}
        >
          VoidView<span className="font-bold text-zinc-400">.Space</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="rounded-full font-bold px-4 py-2 text-zinc-700 hover:bg-black/5 hover:text-black"
          >
            Explore
          </Link>
          <a
            href="https://images.nasa.gov"
            target="_blank"
            rel="noreferrer"
            className="rounded-full font-bold px-4 py-2 text-zinc-700 hover:bg-black/5 hover:text-black"
          >
            NASA Library
          </a>
        </nav>
      </div>
    </header>
  );
}