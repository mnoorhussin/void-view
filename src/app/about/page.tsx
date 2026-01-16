import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — VoidView",
  description: "About VoidView.space",
};

export default function AboutPage() {
  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-900">About</h1>
        <p className="text-zinc-600">
          VoidView is a simple gallery for discovering the best space imagery and generating wallpapers that fit your device.
        </p>
      </header>

      <section className="rounded-3xl bg-white border border-black/5 p-6 md:p-8 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">What it does</h2>
        <ul className="list-disc pl-5 space-y-2 text-zinc-700">
          <li>Browse curated space images by category</li>
          <li>Open image detail pages with metadata</li>
          <li>Generate wallpapers (crop / fit / blur-fill)</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-900">Credits</h2>
        <p className="text-zinc-700 leading-relaxed">
          VoidView pulls media and metadata from public sources (including NASA’s image library). We do not claim ownership
          of third-party content.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900">Legal</h2>
        <p className="text-zinc-700 leading-relaxed">
          Please review our <Link className="underline hover:text-zinc-900" href="/privacy">Privacy Policy</Link> and{" "}
          <Link className="underline hover:text-zinc-900" href="/terms">Terms</Link>.
        </p>
      </section>
    </main>
  );
}