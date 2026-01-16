import "server-only";
import { headers } from "next/headers";

export type FeedResponse = {
  cat: string;
  label: string;
  query: string;
  page: number;
  perPage: number;
  totalHits: number | null;
  totalPages: number | null;
  items: FeaturedItem[];
};

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function getFeed(cat: string, page: number): Promise<FeedResponse | null> {
  const origin = await getOrigin();
  const url = new URL("/api/feed", origin);
  url.searchParams.set("cat", cat);
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return (await res.json()) as FeedResponse;
}

export type FeaturedItem = {
  nasa_id: string;
  title: string;
  description?: string;
  thumb: string;
};

export type FeaturedResponse = {
  query: string;
  page: number;
  items: FeaturedItem[];
};

export interface ApodResponse {
  copyright?: string;
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: "image" | "video";
  service_version?: string;
  title: string;
  url: string;

  // fallback extras (optional)
  nasa_id?: string;
  source?: "apod" | "images-api";
  query?: string;
}

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function getFeatured(cat?: string): Promise<FeaturedResponse | null> {
  const base = getBaseUrl();
  const url = new URL("/api/featured", base);
  if (cat) url.searchParams.set("cat", cat);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  return (await res.json()) as FeaturedResponse;
}

export async function getApod(date?: string): Promise<ApodResponse | null> {
  const base = getBaseUrl();
  const url = new URL("/api/apod", base);
  if (date) url.searchParams.set("date", date);

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error(`Failed to fetch /api/apod: ${res.status} ${res.statusText}`);
    return null;
  }

  return (await res.json()) as ApodResponse;
}