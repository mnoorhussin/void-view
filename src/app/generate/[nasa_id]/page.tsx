"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Mode = "blur" | "cover" | "contain";

const PRESETS = [
  { label: "Phone (1080×1920)", w: 1080, h: 1920 },
  { label: "iPhone (1170×2532)", w: 1170, h: 2532 },
  { label: "Desktop (1920×1080)", w: 1920, h: 1080 },
  { label: "Desktop (2560×1440)", w: 2560, h: 1440 },
  { label: "Ultrawide (3440×1440)", w: 3440, h: 1440 },
] as const;

export default function GeneratePage({ params }: { params: { nasa_id: string } }) {
  // If your project uses params as Promise, change to:
  // export default async function GeneratePage({ params }: { params: Promise<{ nasa_id: string }> }) { const { nasa_id } = await params; ... }
  const nasa_id = (params as any).nasa_id as string;

  const [preset, setPreset] = useState(0);
  const [mode, setMode] = useState<Mode>("blur");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const w = PRESETS[preset].w;
  const h = PRESETS[preset].h;

  const downloadHref = useMemo(() => {
    const sp = new URLSearchParams({
      nasa_id,
      w: String(w),
      h: String(h),
      mode,
    });
    return `/api/wallpaper?${sp.toString()}`;
  }, [nasa_id, w, h, mode]);

  async function generatePreview() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wallpaper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nasa_id, w, h, mode }),
      });

      if (!res.ok) throw new Error(`Generate failed: ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to generate preview");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/image/${nasa_id}`} className="text-sm text-slate-300 hover:text-white">
          ← Back to details
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Fit to device</h1>

      <div className="grid gap-4 md:grid-cols-[360px_1fr]">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div>
            <label className="text-sm text-slate-300">Preset</label>
            <select
              className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2"
              value={preset}
              onChange={(e) => setPreset(Number(e.target.value))}
            >
              {PRESETS.map((p, idx) => (
                <option key={p.label} value={idx}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-300">Mode</label>
            <select
              className="mt-1 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
            >
              <option value="blur">Blur fill (recommended)</option>
              <option value="cover">Crop (cover)</option>
              <option value="contain">Fit (contain)</option>
            </select>
          </div>

          <button
            onClick={generatePreview}
            disabled={loading}
            className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate preview"}
          </button>

          <a
            href={downloadHref}
            className="block text-center w-full rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            Download JPG
          </a>

          {err ? <p className="text-sm text-red-300">{err}</p> : null}

          <p className="text-xs text-slate-400">
            Tip: start with 1080×1920. Very large sizes may be slow on some NASA images.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-slate-300 mb-3">Preview</p>
          {previewUrl ? (
            // use <img> so Next Image config isn't needed for blob URLs
            <img src={previewUrl} alt="Wallpaper preview" className="w-full rounded-lg border border-white/10" />
          ) : (
            <div className="flex items-center justify-center h-[320px] rounded-lg border border-white/10 text-slate-400">
              Click “Generate preview”
            </div>
          )}
        </div>
      </div>
    </main>
  );
}