import type { Metadata } from "next";
import "./globals.css";
import { bodyFont } from "@/lib/fonts";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "VoidView.space",
  description: "Curated space images + fit-to-device wallpapers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={bodyFont.className}>
      <body className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
          {children}
        </main>
        <SiteFooter />
        <CookieBanner />
      </body>
    </html>
  );
}