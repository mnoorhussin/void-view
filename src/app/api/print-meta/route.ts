// src/app/api/print-meta/route.ts
import { NextResponse } from "next/server";
import sharp from "sharp";
import { Readable } from "node:stream";

export const runtime = "nodejs";
export const revalidate = 604800; // 7 days

const LIMIT_INPUT_PIXELS = 268402689; // ~16384*16384 safety cap

async function getCandidateAssetUrls(nasa_id: string): Promise<string[]> {
  const assetRes = await fetch(`https://images-api.nasa.gov/asset/${encodeURIComponent(nasa_id)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate },
  });

  if (assetRes.ok) {
    const data = await assetRes.json();
    const rawItems: Array<string | { href?: string }> = data?.collection?.items ?? [];

    const urls: string[] = rawItems
      .map((it) => (typeof it === "string" ? it : it?.href))
      .filter((u): u is string => typeof u === "string" && u.length > 0);

    const isImg = (u: string) => /\.(jpe?g|png|tif|tiff)$/i.test(u);
    const imgs = urls.filter(isImg);

    // Prefer orig first for accurate print quality, fallback to large/medium/small
    const order = ["~orig", "~large", "~medium", "~small", "~thumb"];
    const picked: string[] = [];

    for (const token of order) {
      const hit = imgs.find((u) => u.includes(token));
      if (hit) picked.push(hit);
    }

    // Add any remaining images as last resort
    for (const u of imgs) {
      if (!picked.includes(u)) picked.push(u);
    }

    if (picked.length) return picked;
  }

  // Fallback: search thumbnail (usually small)
  const searchRes = await fetch(
    `https://images-api.nasa.gov/search?nasa_id=${encodeURIComponent(nasa_id)}&media_type=image`,
    { headers: { Accept: "application/json" }, next: { revalidate } }
  );

  if (searchRes.ok) {
    const s = await searchRes.json();
    const item = s?.collection?.items?.[0];
    const thumb = item?.links?.[0]?.href;
    if (typeof thumb === "string") return [thumb];
  }

  return [];
}

async function fetchImageMetadata(url: string) {
  const controller = new AbortController();

  const res = await fetch(url, {
    signal: controller.signal,
    headers: { Accept: "image/*" },
  });

  if (!res.ok || !res.body) throw new Error(`Fetch failed: ${res.status}`);

  const s = sharp({ limitInputPixels: LIMIT_INPUT_PIXELS });
  const metaPromise = s.metadata();

  // Convert Web stream -> Node stream
  const nodeStream = Readable.fromWeb(res.body as any);
  nodeStream.pipe(s);

  const meta = await metaPromise;

  // Abort remaining download once we have metadata
  try {
    controller.abort();
  } catch {}

  return meta;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nasa_id = searchParams.get("nasa_id");

  if (!nasa_id) {
    return NextResponse.json({ error: "Missing nasa_id" }, { status: 400 });
  }

  const urls = await getCandidateAssetUrls(nasa_id);
  if (!urls.length) {
    return NextResponse.json({ error: "No candidate assets found" }, { status: 404 });
  }

  let lastErr: unknown = null;

  for (const url of urls.slice(0, 4)) {
    try {
      const meta = await fetchImageMetadata(url);

      if (!meta?.width || !meta?.height) {
        lastErr = new Error("No width/height in metadata");
        continue;
      }

      return NextResponse.json(
        {
          nasa_id,
          width: meta.width,
          height: meta.height,
          format: meta.format ?? null,
          sourceUrl: url,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
          },
        }
      );
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  return NextResponse.json(
    { error: "Failed to read image metadata", details: String(lastErr) },
    { status: 502 }
  );
}