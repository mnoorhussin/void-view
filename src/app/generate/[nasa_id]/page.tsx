"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Mode = "blur" | "cover" | "contain";

const PRESETS = [
  { label: "Phone (1080×1920)", w: 1080, h: 1920 },
  { label: "iPhone (1170×2532)", w: 1170, h: 2532 },
  { label: "Desktop (1920×1080)", w: 1920, h: 1080 },
  { label: "Desktop (2560×1440)", w: 2560, h: 1440 },
  { label: "Ultrawide (3440×1440)", w: 3440, h: 1440 },
];

export default function GeneratePage() {
  const params = useParams();
  const raw = (params as any)?.nasa_id as string | string[] | undefined;
  const nasa_id = Array.isArray(raw) ? raw[0] : raw;

  const [preset, setPreset] = useState(0);
  const [mode, setMode] = useState<Mode>("blur");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const w = PRESETS[preset].w;
  const h = PRESETS[preset].h;

  // If user changes settings, force them to generate again
  useEffect(() => {
    setErr(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, mode]);

  const downloadHref = useMemo(() => {
    if (!nasa_id) return "#";
    const sp = new URLSearchParams({
      nasa_id,
      w: String(w),
      h: String(h),
      mode,
    });
    return `/api/wallpaper?${sp.toString()}`;
  }, [nasa_id, w, h, mode]);

  async function generatePreview() {
    if (!nasa_id) {
      setErr("Missing nasa_id in the URL.");
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/wallpaper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nasa_id, w, h, mode }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Generate failed: ${res.status} ${text}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } catch (e: any) {
      setErr(e?.message ?? "Generate failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <div>
        <Link
          href={nasa_id ? `/image/${nasa_id}` : "/"}
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Back
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-zinc-900">Fit to device</h1>

      <div className="grid gap-4 md:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-black/5 bg-white p-4 space-y-4">
          <div>
            <label className="text-sm text-zinc-700">Preset</label>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
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
            <label className="text-sm text-zinc-700">Mode</label>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
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
            className="w-full rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Generating..." : "Generate preview"}
          </button>

          {/* Download hidden until preview is generated */}
          {previewUrl ? (
            <a
              href={downloadHref}
              className="block text-center w-full rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Download JPG
            </a>
          ) : null}

          {err ? <p className="text-sm text-red-600">{err}</p> : null}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-4">
          <p className="text-sm text-zinc-700 mb-3">Preview</p>

          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Wallpaper preview"
              className="w-full rounded-xl border border-black/10"
            />
          ) : (
            <div className="flex items-center justify-center h-[320px] rounded-xl border border-black/10 text-zinc-500">
              Click “Generate preview”
            </div>
          )}
        </div>
      </div>
    </main>
  );
}