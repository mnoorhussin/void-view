import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — VoidView",
};

export default function ContactPage() {
  // Change this to your real support email
  const email = "support@voidview.space";

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-900">Contact</h1>
        <p className="text-zinc-600">
          For feedback, business inquiries, or takedown requests, email us.
        </p>
      </header>

      <section className="rounded-3xl bg-white border border-black/5 p-6 md:p-8 space-y-3">
        <p className="text-zinc-700">
          Email:{" "}
          <a className="underline hover:text-zinc-900" href={`mailto:${email}`}>
            {email}
          </a>
        </p>
      </section>
    </main>
  );
}