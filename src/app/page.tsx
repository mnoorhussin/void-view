import Image from "next/image";
import Link from "next/link";
import { getFeatured } from "@/lib/nasa";
import { card, buttonHero, buttonHeroGhost } from "@/components/ui";

export default async function Home() {
  const featured = await getFeatured();
  const items = featured?.items ?? [];
  const hero = items[0];

  if (!hero) {
    return <div className={card + " p-8"}>No images right now.</div>;
  }

  return (
    <div className="space-y-10">
      <section className={card + " relative overflow-hidden"}>
        <div className="relative h-[56vh] w-full">
          <Image src={hero.thumb} alt={hero.title} fill priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
          <p className="text-xs uppercase tracking-[0.18em] text-white/80">Featured</p>
          <h1 className="mt-2 max-w-4xl text-2xl font-semibold leading-tight md:text-4xl">
            {hero.title}
          </h1>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link className={buttonHero} href={`/image/${hero.nasa_id}`}>
              View details
            </Link>
            <Link className={buttonHeroGhost} href={`/generate/${hero.nasa_id}`}>
              Fit to device
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Explore</h2>
          <p className="mt-1 text-sm text-zinc-600">Topic: {featured?.query}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.slice(1, 25).map((it) => (
            <Link
              key={it.nasa_id}
              href={`/image/${it.nasa_id}`}
              className={card + " overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition"}
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