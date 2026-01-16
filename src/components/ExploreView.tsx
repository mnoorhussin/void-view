import Image from "next/image";
import Link from "next/link";
import { getFeatured } from "@/lib/nasa";
import { CATEGORIES, categoryBySlug } from "@/lib/categories";

export default async function ExploreView({ activeSlug }: { activeSlug: string }) {
  const active = categoryBySlug(activeSlug);
  const featured = await getFeatured(active.slug);

  const items = featured?.items ?? [];
  const hero = items[0];

  if (!hero) {
    return (
      <div className="rounded-3xl bg-white border border-black/5 p-8">
        <p className="text-zinc-600">No images right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const isActive = c.slug === active.slug;
          const href = c.slug === "featured" ? "/" : `/c/${c.slug}/1`;

          return (
            <Link
              key={c.slug}
              href={href}
              className={
                isActive
                  ? "rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
                  : "rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-800 border border-black/10 hover:bg-zinc-50"
              }
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="relative h-[56vh] w-full">
          <Image src={hero.thumb} alt={hero.title} fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/80">{active.label}</p>
          <h1 className="mt-2 max-w-4xl text-2xl font-semibold md:text-4xl">{hero.title}</h1>

          <div className="mt-5 flex gap-3">
            <Link
              className="rounded-full bg-white/90 px-5 py-2.5 text-sm font-medium text-black hover:bg-white"
              href={`/image/${hero.nasa_id}`}
            >
              View details
            </Link>
            <Link
              className="rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15"
              href={`/generate/${hero.nasa_id}`}
            >
              Fit to device
            </Link>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.slice(1, 25).map((it) => (
            <Link
              key={it.nasa_id}
              href={`/image/${it.nasa_id}`}
              className="rounded-3xl bg-white border border-black/5 overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image src={it.thumb} alt={it.title} fill className="object-cover" />
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-zinc-900 line-clamp-2">{it.title}</p>
                <p className="mt-1 text-xs text-zinc-500">Open</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}