// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";

const PAGES_PER_CATEGORY = 5; // <-- change this to control how many pages get indexed

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const pagedCategoryRoutes: MetadataRoute.Sitemap = [];

  for (const c of CATEGORIES) {
    // featured page 1 is the homepage, so only include /c/featured/2..N
    if (c.slug === "featured") {
      for (let p = 2; p <= PAGES_PER_CATEGORY; p++) {
        pagedCategoryRoutes.push({
          url: `${baseUrl}/c/featured/${p}`,
          lastModified: now,
          changeFrequency: "daily",
          priority: 0.6,
        });
      }
      continue;
    }

    // include /c/<slug>/1..N
    for (let p = 1; p <= PAGES_PER_CATEGORY; p++) {
      pagedCategoryRoutes.push({
        url: `${baseUrl}/c/${encodeURIComponent(c.slug)}/${p}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: p === 1 ? 0.8 : 0.6,
      });
    }
  }

  return [...staticRoutes, ...pagedCategoryRoutes];
}