import { NextResponse } from "next/server";
import { categoryBySlug } from "@/lib/categories";

export const runtime = "nodejs";
export const revalidate = 3600;

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

async function fetchJsonWithRetry<T>(url: string, retries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
      if (attempt < retries) await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr;
}

type FeaturedItem = {
  nasa_id: string;
  title: string;
  description?: string;
  thumb: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cat = searchParams.get("cat") ?? "featured";
  const category = categoryBySlug(cat);

  // keep it “fresh” but within the chosen category
  const page = String(1 + Math.floor(Math.random() * 8));

  const url = new URL(BASE);
  url.searchParams.set("q", category.query);
  url.searchParams.set("media_type", "image");
  url.searchParams.set("page", page);

  try {
    const data = await fetchJsonWithRetry<any>(url.toString(), 2);

    const items: FeaturedItem[] =
      data?.collection?.items
        ?.map((it: any) => {
          const d = it?.data?.[0];
          const l = it?.links?.[0];
          if (!d?.nasa_id || !l?.href) return null;
          return {
            nasa_id: d.nasa_id,
            title: d.title ?? "Untitled",
            description: d.description,
            thumb: l.href,
          };
        })
        ?.filter(Boolean) ?? [];

    return NextResponse.json(
      {
        cat: category.slug,
        query: category.query,
        page: Number(page),
        items: items.slice(0, 30),
      },
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