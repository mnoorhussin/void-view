import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

type Mode = "cover" | "contain";

const LIMIT_INPUT_PIXELS = 268402689; // ~16384*16384
const MAX_DIM = 12000; // safety cap for print exports (pixels)

function parseMode(x: string | null): Mode {
  return x === "contain" ? "contain" : "cover";
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

async function getBestAssetUrl(nasa_id: string): Promise<string | null> {
  // Prefer NASA asset variants, fallback to search thumbnail
  const assetRes = await fetch(`https://images-api.nasa.gov/asset/${encodeURIComponent(nasa_id)}`, {
    headers: { Accept: "application/json" },
  });

  if (assetRes.ok) {
    const data = await assetRes.json();
    const rawItems: Array<string | { href?: string }> = data?.collection?.items ?? [];
    const urls: string[] = rawItems
      .map((it) => (typeof it === "string" ? it : it?.href))
      .filter((u): u is string => typeof u === "string" && u.length > 0);

    const isJpgPng = (u: string) => /\.(jpe?g|png)$/i.test(u);
    const isTiff = (u: string) => /\.(tif|tiff)$/i.test(u);

    const jpgs = urls.filter(isJpgPng);
    const tiffs = urls.filter(isTiff);

    const order = ["~large", "~orig", "~medium", "~small", "~thumb"];
    const pickFrom = (arr: string[]) =>
      order.map((t) => arr.find((u) => u.includes(t))).find(Boolean) ?? arr[0] ?? null;

    const best = pickFrom(jpgs) ?? pickFrom(tiffs);
    if (best) return best;
  }

  const searchRes = await fetch(
    `https://images-api.nasa.gov/search?nasa_id=${encodeURIComponent(nasa_id)}&media_type=image`,
    { headers: { Accept: "application/json" } }
  );

  if (!searchRes.ok) return null;
  const s = await searchRes.json();
  const item = s?.collection?.items?.[0];
  const thumb = item?.links?.[0]?.href;

  return typeof thumb === "string" ? thumb : null;
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download source image: ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function renderPrint(input: Buffer, w: number, h: number, mode: Mode) {
  const width = clampInt(w, 600, MAX_DIM);
  const height = clampInt(h, 600, MAX_DIM);

  if (mode === "contain") {
    return await sharp(input, { limitInputPixels: LIMIT_INPUT_PIXELS })
      .resize(width, height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // white “matte”
      })
      .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
      .toBuffer();
  }

  // cover: crop to fill poster aspect ratio
  return await sharp(input, { limitInputPixels: LIMIT_INPUT_PIXELS })
    .resize(width, height, { fit: "cover", position: "entropy" })
    .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

// GET = download (attachment)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const nasa_id = searchParams.get("nasa_id");
  const w = Number(searchParams.get("w"));
  const h = Number(searchParams.get("h"));
  const mode = parseMode(searchParams.get("mode"));
  const label = searchParams.get("label") ?? "print";

  if (!nasa_id || !w || !h) {
    return NextResponse.json({ error: "Missing nasa_id, w, h" }, { status: 400 });
  }

  const bestUrl = await getBestAssetUrl(nasa_id);
  if (!bestUrl) return NextResponse.json({ error: "No usable asset found" }, { status: 404 });

  try {
    const input = await downloadBuffer(bestUrl);
    const out = await renderPrint(input, w, h, mode);

    const filename = `${nasa_id}_${label}_${w}x${h}_${mode}.jpg`;
    const body = new Uint8Array(out);

    return new Response(body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Print generation failed", details: String(e?.message ?? e), sourceUrl: bestUrl },
      { status: 500 }
    );
  }
}

// POST = preview (inline, no-store)
export async function POST(req: Request) {
  const bodyJson = await req.json().catch(() => null);

  const nasa_id = bodyJson?.nasa_id as string | undefined;
  const w = Number(bodyJson?.w);
  const h = Number(bodyJson?.h);
  const mode = parseMode(bodyJson?.mode ?? null);

  if (!nasa_id || !w || !h) {
    return NextResponse.json({ error: "Missing nasa_id, w, h" }, { status: 400 });
  }

  const bestUrl = await getBestAssetUrl(nasa_id);
  if (!bestUrl) return NextResponse.json({ error: "No usable asset found" }, { status: 404 });

  try {
    const input = await downloadBuffer(bestUrl);
    const out = await renderPrint(input, w, h, mode);

    return new Response(new Uint8Array(out), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Print preview failed", details: String(e?.message ?? e), sourceUrl: bestUrl },
      { status: 500 }
    );
  }
}