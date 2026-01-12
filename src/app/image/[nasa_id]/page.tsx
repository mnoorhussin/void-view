// src/app/image/[nasa_id]/page.tsx
import Image from "next/image";
import Link from "next/link";

async function getItem(nasaId: string) {
  const url = `https://images-api.nasa.gov/search?nasa_id=${encodeURIComponent(nasaId)}&media_type=image`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  const item = data?.collection?.items?.[0];
  if (!item) return null;

  const d = item.data?.[0];
  const thumb = item.links?.[0]?.href;

  return {
    nasa_id: d?.nasa_id as string,
    title: (d?.title as string) ?? "Untitled",
    description: (d?.description as string) ?? "",
    thumb: thumb as string,
  };
}

function btnClass(primary = false) {
  return primary
    ? "inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200"
    : "inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15";
}

export default async function ImagePage({ params }: { params: Promise<{ nasa_id: string }> }) {
  const { nasa_id } = await params;
  const item = await getItem(nasa_id);

  if (!item) {
    return (
      <main className="py-10">
        <h1 className="text-2xl font-bold">Not found</h1>
        <p className="mt-2 text-slate-400">Couldn’t load that image.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-slate-300 hover:text-white">← Back</Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="relative w-full h-[60vh]">
          <Image src={item.thumb} alt={item.title} fill className="object-cover" priority />
        </div>
        <div className="p-5 md:p-7">
          <h1 className="text-2xl font-bold md:text-3xl">{item.title}</h1>
          {item.description ? (
            <p className="mt-3 max-w-3xl text-slate-300">{item.description}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link className={btnClass(true)} href={`/generate/${item.nasa_id}`}>
              Fit to device
            </Link>
            <a className={btnClass(true)} href={item.thumb} target="_blank" rel="noreferrer">
              Open image
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}