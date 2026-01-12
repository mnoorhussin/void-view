import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

type Mode = "cover" | "contain" | "blur";

const LIMIT_INPUT_PIXELS = 268402689; // ~16384*16384 safety cap

async function getBestAssetUrl(nasa_id: string): Promise<string | null> {
  // 1) Try NASA asset endpoint (best quality variants)
  const assetRes = await fetch(
    `https://images-api.nasa.gov/asset/${encodeURIComponent(nasa_id)}`,
    { headers: { Accept: "application/json" } }
  );

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

    // Prefer "~large" to reduce timeouts; then "~orig"; then others.
    const order = ["~large", "~orig", "~medium", "~small", "~thumb"];
    const pickFrom = (arr: string[]) =>
      order.map((t) => arr.find((u) => u.includes(t))).find(Boolean) ?? arr[0] ?? null;

    const best = pickFrom(jpgs) ?? pickFrom(tiffs);
    if (best) return best;
  }

  // 2) Fallback: NASA search thumbnail (works even when asset list is odd)
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

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(n)));
}

async function renderWallpaper(input: Buffer, w: number, h: number, mode: Mode) {
  // Basic safety limits (avoid insane sizes)
  const width = clampInt(w, 320, 4000);
  const height = clampInt(h, 320, 4000);

  if (mode === "cover") {
    return await sharp(input, { limitInputPixels: LIMIT_INPUT_PIXELS })
      .resize(width, height, { fit: "cover", position: "entropy" })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  if (mode === "contain") {
    return await sharp(input, { limitInputPixels: LIMIT_INPUT_PIXELS })
      .resize(width, height, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  // blur-fill: blurred background cover + centered contain foreground
  const bg = await sharp(input, { limitInputPixels: LIMIT_INPUT_PIXELS })
    .resize(width, height, { fit: "cover" })
    .blur(35)
    .jpeg({ quality: 80 })
    .toBuffer();

  const fg = await sharp(input, { limitInputPixels: LIMIT_INPUT_PIXELS })
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return await sharp(bg, { limitInputPixels: LIMIT_INPUT_PIXELS })
    .composite([{ input: fg, gravity: "center" }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

function parseMode(x: string | null): Mode {
  if (x === "contain" || x === "blur" || x === "cover") return x;
  return "blur";
}

// GET is useful for “Download” links
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const nasa_id = searchParams.get("nasa_id");
  const w = Number(searchParams.get("w"));
  const h = Number(searchParams.get("h"));
  const mode = parseMode(searchParams.get("mode"));

  if (!nasa_id || !w || !h) {
    return NextResponse.json({ error: "Missing nasa_id, w, h" }, { status: 400 });
  }

  const bestUrl = await getBestAssetUrl(nasa_id);
  if (!bestUrl) return NextResponse.json({ error: "No usable asset found" }, { status: 404 });

  try {
    const input = await downloadBuffer(bestUrl);
    const out = await renderWallpaper(input, w, h, mode);

    return new Response(out, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `inline; filename="${nasa_id}_${w}x${h}_${mode}.jpg"`,
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Wallpaper generation failed", details: String(e?.message ?? e), sourceUrl: bestUrl },
      { status: 500 }
    );
  }
}

// POST is convenient for preview generation from the UI
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const nasa_id = body?.nasa_id as string | undefined;
  const w = Number(body?.w);
  const h = Number(body?.h);
  const mode = parseMode(body?.mode ?? null);

  if (!nasa_id || !w || !h) {
    return NextResponse.json({ error: "Missing nasa_id, w, h" }, { status: 400 });
  }

  const bestUrl = await getBestAssetUrl(nasa_id);
  if (!bestUrl) return NextResponse.json({ error: "No usable asset found" }, { status: 404 });

  try {
    const input = await downloadBuffer(bestUrl);
    const out = await renderWallpaper(input, w, h, mode);

    return new Response(out, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Wallpaper generation failed", details: String(e?.message ?? e), sourceUrl: bestUrl },
      { status: 500 }
    );
  }
}