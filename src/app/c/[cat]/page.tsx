// src/app/c/[cat]/page.tsx
import { notFound, redirect } from "next/navigation";
import { isValidCategorySlug } from "@/lib/categories";

export default async function CategoryIndex({
  params,
}: {
  params: Promise<{ cat: string }>;
}) {
  const { cat } = await params;

  if (!isValidCategorySlug(cat)) notFound();

  // Featured canonical is the homepage
  if (cat === "featured") redirect("/");

  // Canonical category URL
  redirect(`/c/${cat}/1`);
}