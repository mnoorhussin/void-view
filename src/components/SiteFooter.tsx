import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-black/5">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-600 md:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="font-semibold text-zinc-900">VoidView</p>
            <p className="mt-2 leading-relaxed">
              Curated space imagery + fit-to-device wallpapers.
            </p>
          </div>

          <div>
            <p className="font-semibold text-zinc-900">Legal</p>
            <div className="mt-2 flex flex-col gap-2">
              <Link className="hover:text-zinc-900" href="/privacy">Privacy Policy</Link>
              <Link className="hover:text-zinc-900" href="/terms">Terms</Link>
              <Link className="hover:text-zinc-900" href="/contact">Contact</Link>
            </div>
          </div>

          <div>
            <p className="font-semibold text-zinc-900">Credits</p>
            <p className="mt-2 leading-relaxed">
              Not affiliated with NASA. Credits belong to their respective owners.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-black/5 pt-6 text-xs text-zinc-500">
          © {new Date().getFullYear()} voidview.space
        </div>
      </div>
    </footer>
  );
}