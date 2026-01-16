// src/app/c/[cat]/[page]/page.tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isValidCategorySlug, categoryBySlug } from "@/lib/categories";
import ExplorePagedView from "@/components/ExplorePagedView";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function hrefForPage(cat: string, page: number) {
  if (cat === "featured") return page === 1 ? "/" : `/c/featured/${page}`;
  return `/c/${cat}/${page}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cat: string; page: string }>;
}): Promise<Metadata> {
  const { cat, page } = await params;

  if (!isValidCategorySlug(cat)) return {};

  const pageNum = Math.max(1, Math.floor(Number(page) || 1));
  const baseUrl = getBaseUrl();

  const label = categoryBySlug(cat).label;

  const canonicalPath = hrefForPage(cat, pageNum);
  const canonical = `${baseUrl}${canonicalPath}`;

  const title = `${label} — Page ${pageNum} | VoidView`;
  const description = `Browse ${label.toLowerCase()} space images on VoidView. Page ${pageNum}.`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ cat: string; page: string }>;
}) {
  const { cat, page } = await params;

  if (!isValidCategorySlug(cat)) notFound();

  const pageNum = Math.floor(Number(page));

  if (!Number.isFinite(pageNum) || pageNum < 1) {
    redirect(cat === "featured" ? "/" : `/c/${cat}/1`);
  }

  // Canonical: featured page 1 = "/"
  if (cat === "featured" && pageNum === 1) {
    redirect("/");
  }

  return <ExplorePagedView activeSlug={cat} page={pageNum} />;
}