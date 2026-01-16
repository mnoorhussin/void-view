// src/app/api/feed/route.ts
import { NextResponse } from "next/server";
import { categoryBySlug } from "@/lib/categories";

export const runtime = "nodejs";
export const revalidate = 3600;

const BASE = "https://images-api.nasa.gov/search";
const PER_PAGE = 25;

function clampPage(n: number) {
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 100) return 100;
  return Math.floor(n);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const cat = searchParams.get("cat") ?? "featured";
  const page = clampPage(Number(searchParams.get("page") ?? "1"));
  const category = categoryBySlug(cat);

  const url = new URL(BASE);
  url.searchParams.set("q", category.query);
  url.searchParams.set("media_type", "image");
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch NASA feed", status: res.status },
      { status: 502 }
    );
  }

  const data = await res.json();

  // map -> filter out items without thumbnails -> THEN slice to PER_PAGE
  const allItems =
    data?.collection?.items
      ?.map((it: any) => {
        const d = it?.data?.[0];
        const l = it?.links?.[0];
        if (!d?.nasa_id || !l?.href) return null;
        return {
          nasa_id: d.nasa_id as string,
          title: (d.title as string) ?? "Untitled",
          description: d.description as string | undefined,
          thumb: l.href as string,
        };
      })
      ?.filter(Boolean) ?? [];

  const items = allItems.slice(0, PER_PAGE);

  const totalHits = data?.collection?.metadata?.total_hits ?? null;
  const totalPages = totalHits ? Math.ceil(totalHits / PER_PAGE) : null;

  return NextResponse.json(
    {
      cat: category.slug,
      label: category.label,
      query: category.query,
      page,
      perPage: PER_PAGE,
      totalHits,
      totalPages,
      returned: items.length, // debug
      items,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}