export type Category = {
  slug: string;
  label: string;
  query: string;
};

export const CATEGORIES: Category[] = [
  { slug: "featured", label: "Featured", query: "space" },
  { slug: "nebulae", label: "Nebulae", query: "nebula" },
  { slug: "galaxies", label: "Galaxies", query: "galaxy" },
  { slug: "planets", label: "Planets", query: "planet" },
  { slug: "moon", label: "Moon", query: "moon" },
  { slug: "mars", label: "Mars", query: "mars" },
  { slug: "earth", label: "Earth", query: "earth from space" },
  { slug: "iss", label: "ISS", query: "international space station" },
  { slug: "astronauts", label: "Astronauts", query: "astronaut" },
  { slug: "telescopes", label: "Telescopes", query: "hubble" },
];

export function categoryBySlug(slug?: string) {
  return CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[0];
}

const SLUG_SET = new Set(CATEGORIES.map((c) => c.slug));
export function isValidCategorySlug(slug: string) {
  return SLUG_SET.has(slug);
}