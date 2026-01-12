import { Sora, Inter } from "next/font/google";

export const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const logoFont = Sora({
  subsets: ["latin"],
  weight: ["700", "800"],
});