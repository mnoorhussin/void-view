import "server-only";

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

export async function getFeatured(): Promise<FeaturedResponse | null> {
  const base = getBaseUrl();
  const res = await fetch(new URL("/api/featured", base).toString(), {
    next: { revalidate: 3600 },
  });

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