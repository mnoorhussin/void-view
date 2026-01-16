import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms — VoidView",
};

export default function TermsPage() {
  const lastUpdated = "2026-01-15";

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-900">Terms of Service</h1>
        <p className="text-sm text-zinc-600">Last updated: {lastUpdated}</p>
      </header>

      <section className="rounded-3xl bg-white border border-black/5 p-6 md:p-8 space-y-4">
        <p className="text-zinc-700 leading-relaxed">
          By accessing or using voidview.space (the “Site”), you agree to these Terms.
          If you do not agree, do not use the Site.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900">Use of the Site</h2>
        <p className="text-zinc-700 leading-relaxed">
          You may browse and download wallpapers for personal use. You agree not to misuse the Site,
          attempt to disrupt it, or scrape it in a way that harms performance for others.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900">Images and credits</h2>
        <p className="text-zinc-700 leading-relaxed">
          The Site surfaces images from public sources (including NASA’s image library) and displays available
          metadata/credits where possible. We do not claim ownership of third-party content.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900">No warranty</h2>
        <p className="text-zinc-700 leading-relaxed">
          The Site is provided “as is” without warranties of any kind. We do not guarantee uninterrupted availability
          or that content will always be accurate.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900">Limitation of liability</h2>
        <p className="text-zinc-700 leading-relaxed">
          To the maximum extent permitted by law, we are not liable for any indirect or consequential damages arising
          from your use of the Site.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900">Advertising</h2>
        <p className="text-zinc-700 leading-relaxed">
          The Site may display third-party ads. See our <Link className="underline hover:text-zinc-900" href="/privacy">Privacy Policy</Link>{" "}
          for details.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900">Changes</h2>
        <p className="text-zinc-700 leading-relaxed">
          We may modify these Terms at any time. Continued use of the Site means you accept the updated Terms.
        </p>

        <h2 className="text-lg font-semibold text-zinc-900">Contact</h2>
        <p className="text-zinc-700 leading-relaxed">
          Contact us at <Link className="underline hover:text-zinc-900" href="/contact">/contact</Link>.
        </p>

        <p className="text-xs text-zinc-500 pt-2">
          Note: This template is provided for convenience and is not legal advice.
        </p>
      </section>
    </main>
  );
}