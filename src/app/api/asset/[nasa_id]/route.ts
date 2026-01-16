import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 86400;

const ASSET_URL = "https://images-api.nasa.gov/asset";
const SEARCH_URL = "https://images-api.nasa.gov/search";

type AssetItem = string | { href?: string };

function normalizeUrls(items: AssetItem[]): string[] {
  return items
    .map((it) => (typeof it === "string" ? it : it?.href))
    .filter((x): x is string => typeof x === "string" && x.length > 0);
}
type Kind = "jpg" | "tiff" | "none" | "thumb-fallback";
function pickBest(urls: string[]): { best: string | null; kind: Kind } {
  const isJpgPng = (u: string) => /\.(jpe?g|png)$/i.test(u);
  const isTiff = (u: string) => /\.(tif|tiff)$/i.test(u);

  const order = ["~large", "~orig", "~medium", "~small", "~thumb"];

  const pickFrom = (candidates: string[]) => {
    for (const token of order) {
      const hit = candidates.find((u) => u.includes(token));
      if (hit) return hit;
    }
    return candidates[0] ?? null;
  };

  const jpgs = urls.filter(isJpgPng);
  if (jpgs.length) return { best: pickFrom(jpgs), kind: "jpg" };

  const tiffs = urls.filter(isTiff);
  if (tiffs.length) return { best: pickFrom(tiffs), kind: "tiff" };

  return { best: null, kind: "none" };
}

async function fallbackThumbFromSearch(nasa_id: string): Promise<string | null> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("nasa_id", nasa_id);
  url.searchParams.set("media_type", "image");

  const res = await fetch(url.toString(), { next: { revalidate } });
  if (!res.ok) return null;

  const data = await res.json();
  const item = data?.collection?.items?.[0];
  const thumb = item?.links?.[0]?.href;
  return typeof thumb === "string" ? thumb : null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ nasa_id: string }> }
) {
  const { nasa_id } = await params;

  const res = await fetch(`${ASSET_URL}/${encodeURIComponent(nasa_id)}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch asset list", status: res.status },
      { status: 502 }
    );
  }

  const data = await res.json();
  const rawItems: AssetItem[] = data?.collection?.items ?? [];
  const urls = normalizeUrls(rawItems);

  const picked = pickBest(urls);

  // If no usable asset, fall back to the search thumbnail
  let best = picked.best;
  let kind = picked.kind;

  if (!best) {
    const thumb = await fallbackThumbFromSearch(nasa_id);
    if (thumb) {
      best = thumb;
      kind = "thumb-fallback";
    }
  }

  const { searchParams } = new URL(req.url);
  const debug = searchParams.get("debug") === "1";

  return NextResponse.json({
    nasa_id,
    best,
    kind,
    itemsCount: urls.length,
    ...(debug ? { items: urls.slice(0, 50) } : {}),
  });
}