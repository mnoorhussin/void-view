import { redirect } from "next/navigation";
import ExplorePagedView from "@/components/ExplorePagedView";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;

  // Backward compatibility: /?cat=nebulae -> /c/nebulae/1
  if (sp?.cat && sp.cat !== "featured") {
    redirect(`/c/${sp.cat}/1`);
  }

  // Featured = page 1
  return <ExplorePagedView activeSlug="featured" page={1} />;
}