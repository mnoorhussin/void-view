export function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export const card =
  "rounded-3xl bg-white border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]";

export const buttonBase =
  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium " +
  "transition focus:outline-none focus:ring-4 focus:ring-black/10";

export const buttonPrimary = cx(
  buttonBase,
  "bg-black text-white hover:bg-zinc-800"
);

export const buttonSecondary = cx(
  buttonBase,
  "bg-white text-zinc-900 border border-black/10 hover:bg-zinc-50"
);

// For hero-on-image (light buttons)
export const buttonHero = cx(
  buttonBase,
  "bg-white/90 text-black hover:bg-white"
);

export const buttonHeroGhost = cx(
  buttonBase,
  "bg-white/10 text-white border border-white/25 hover:bg-white/15 focus:ring-white/20"
);