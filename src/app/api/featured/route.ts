// src/app/api/featured/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // cache 1 hour

const BASE = "https://images-api.nasa.gov/search";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, timeoutMs = 8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate },
    });
  } finally {
    clearTimeout(t);
  }
}

function isRetryableStatus(s: number) {
  return s === 408 || s === 429 || (s >= 500 && s <= 599);
}

async function fetchJsonWithRetry<T>(url: string, retries = 2): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, 8000);

      if (!res.ok) {
        if (isRetryableStatus(res.status) && attempt < retries) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText}: ${body}`);
      }

      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastErr;
}

type FeaturedItem = {
  nasa_id: string;
  title: string;
  description?: string;
  thumb: string; // small/medium image for grid/hero
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function GET() {
  // Curated topics that produce consistently great images
  const queries = [
    "nebula",
    "galaxy",
    "hubble",
    "jwst",
    "saturn",
    "jupiter",
    "mars",
    "earth from space",
    "astronaut",
  ];

  // random query + random page (keeps homepage fresh)
  const q = pick(queries);
  const page = String(1 + Math.floor(Math.random() * 10));

  const url = new URL(BASE);
  url.searchParams.set("q", q);
  url.searchParams.set("media_type", "image");
  url.searchParams.set("page", page);

  try {
    const data = await fetchJsonWithRetry<any>(url.toString(), 2);

    const items: FeaturedItem[] =
      data?.collection?.items
        ?.map((it: any) => {
          const d = it?.data?.[0];
          const l = it?.links?.[0]; // typically thumbnail
          if (!d?.nasa_id || !l?.href) return null;
          return {
            nasa_id: d.nasa_id,
            title: d.title ?? "Untitled",
            description: d.description,
            thumb: l.href,
          };
        })
        ?.filter(Boolean) ?? [];

    // return a small set for homepage
    return NextResponse.json(
      { query: q, page: Number(page), items: items.slice(0, 30) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch featured images", details: String(e) },
      { status: 502 }
    );
  }
}