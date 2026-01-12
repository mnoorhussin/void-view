// src/app/api/apod/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // cache 1 hour

const APOD_URL = "https://api.nasa.gov/planetary/apod";
const IMAGES_SEARCH_URL = "https://images-api.nasa.gov/search";
const IMAGES_ASSET_URL = "https://images-api.nasa.gov/asset";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      next: { revalidate },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

async function fetchJsonWithRetry<T>(url: string, retries = 2): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, undefined, 8000);

      if (!res.ok) {
        if (isRetryableStatus(res.status) && attempt < retries) {
          const backoff = 400 * (attempt + 1);
          await sleep(backoff);
          continue;
        }
        const body = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} :: ${body}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
    }
  }

  throw lastErr;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function getLargestImageUrlFromAssets(nasaId: string): Promise<string | null> {
  // Asset endpoint returns a list of files (often includes ~orig.jpg)
  const url = `${IMAGES_ASSET_URL}/${encodeURIComponent(nasaId)}`;

  const data = await fetchJsonWithRetry<any>(url, 2);
  const items: string[] = data?.collection?.items ?? [];

  const jpgs = items.filter((u) => typeof u === "string" && u.match(/\.(jpg|jpeg|png)$/i));
  if (jpgs.length === 0) return null;

  // Prefer originals if present
  const orig =
    jpgs.find((u) => u.includes("~orig")) ||
    jpgs.find((u) => u.toLowerCase().includes("orig")) ||
    jpgs.find((u) => u.includes("~large")) ||
    jpgs[0];

  return orig ?? null;
}

async function apodFallbackFromImagesApi() {
  const queries = ["nebula", "galaxy", "hubble", "jwst", "saturn", "jupiter", "mars", "earth from space"];
  const q = pick(queries);
  const page = String(1 + Math.floor(Math.random() * 10));

  const url = new URL(IMAGES_SEARCH_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("media_type", "image");
  url.searchParams.set("page", page);

  const data = await fetchJsonWithRetry<any>(url.toString(), 2);

  const first = data?.collection?.items?.find((it: any) => it?.data?.[0]?.nasa_id && it?.links?.[0]?.href);
  if (!first) throw new Error("Images API returned no usable items");

  const d = first.data[0];
  const nasa_id: string = d.nasa_id;
  const title: string = d.title ?? "Untitled";
  const explanation: string = d.description ?? "From NASA Image Library.";
  const previewUrl: string = first.links[0].href;

  let hdurl: string | undefined;
  try {
    const largest = await getLargestImageUrlFromAssets(nasa_id);
    if (largest) hdurl = largest;
  } catch {
    // If asset lookup fails, we still can return previewUrl
  }

  const today = new Date().toISOString().slice(0, 10);

  // Return APOD-like shape + a couple extra fields
  return {
    date: today,
    title,
    explanation,
    media_type: "image" as const,
    url: previewUrl,
    hdurl,
    nasa_id,
    source: "images-api",
    query: q,
  };
}

export async function GET(req: Request) {
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? undefined;

  const baseParams = new URLSearchParams({ api_key: apiKey });
  if (date) baseParams.set("date", date);

  const hdParams = new URLSearchParams(baseParams);
  hdParams.set("hd", "true");

  const nonHdParams = new URLSearchParams(baseParams);
  nonHdParams.set("hd", "false");

  try {
    const apod = await fetchJsonWithRetry<any>(`${APOD_URL}?${hdParams.toString()}`, 2);
    return NextResponse.json(apod, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (errHd) {
    try {
      const apod = await fetchJsonWithRetry<any>(`${APOD_URL}?${nonHdParams.toString()}`, 2);
      return NextResponse.json(apod, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      });
    } catch (errNonHd) {
      // Final fallback: NASA Images API (no key)
      try {
        const fallback = await apodFallbackFromImagesApi();
        return NextResponse.json(fallback, {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            "X-APOD-Fallback": "1",
          },
        });
      } catch (errFallback) {
        return NextResponse.json(
          {
            error: "Failed to fetch APOD (and fallback failed)",
            details: {
              hd: String(errHd),
              nonHd: String(errNonHd),
              fallback: String(errFallback),
            },
          },
          { status: 502 }
        );
      }
    }
  }
}