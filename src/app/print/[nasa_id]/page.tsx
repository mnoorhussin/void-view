"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";

const SIZES = [
  { label: "8×10 in", wIn: 8, hIn: 10 },
  { label: "11×14 in", wIn: 11, hIn: 14 },
  { label: "12×18 in (Poster)", wIn: 12, hIn: 18 },
  { label: "16×20 in", wIn: 16, hIn: 20 },
  { label: "18×24 in", wIn: 18, hIn: 24 },
  { label: "24×36 in (Large Poster)", wIn: 24, hIn: 36 },
] as const;

const DPIS = [200, 300] as const;

const PRINT_MODE = "contain" as const; // <-- FORCE NO CROP

function px(inches: number, dpi: number) {
  return Math.round(inches * dpi);
}

function mp(w: number, h: number) {
  return Math.round(((w * h) / 1_000_000) * 10) / 10;
}

function qualityLabel(effDpi: number) {
  if (effDpi >= 300) return { label: "Excellent", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (effDpi >= 240) return { label: "Great", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (effDpi >= 200) return { label: "Good", color: "text-amber-700 bg-amber-50 border-amber-200" };
  if (effDpi >= 150) return { label: "Fair", color: "text-amber-700 bg-amber-50 border-amber-200" };
  return { label: "Low", color: "text-red-700 bg-red-50 border-red-200" };
}

export default function PrintPage() {
  const params = useParams();
  const raw = (params as any)?.nasa_id as string | string[] | undefined;
  const nasa_id = Array.isArray(raw) ? raw[0] : raw;

  const [sizeIdx, setSizeIdx] = useState(2);
  const [dpi, setDpi] = useState<(typeof DPIS)[number]>(300);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");

  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Source metadata for quality check
  const [metaLoading, setMetaLoading] = useState(false);
  const [srcMeta, setSrcMeta] = useState<{ width: number; height: number; format?: string | null } | null>(null);
  const [metaErr, setMetaErr] = useState<string | null>(null);

  const s = SIZES[sizeIdx];

  const target = useMemo(() => {
    let w = px(s.wIn, dpi);
    let h = px(s.hIn, dpi);
    if (orientation === "landscape") [w, h] = [h, w];

    const wIn = orientation === "landscape" ? s.hIn : s.wIn;
    const hIn = orientation === "landscape" ? s.wIn : s.hIn;

    return { w, h, wIn, hIn };
  }, [s, dpi, orientation]);

  // Smaller preview size (same ratio, max 1600px on long edge)
  const previewDims = useMemo(() => {
    const long = Math.max(target.w, target.h);
    const scale = long > 1600 ? 1600 / long : 1;
    return { w: Math.round(target.w * scale), h: Math.round(target.h * scale) };
  }, [target]);

  // Fetch source meta once nasa_id exists
  useEffect(() => {
    let canceled = false;
    async function run() {
      if (!nasa_id) return;
      setMetaLoading(true);
      setMetaErr(null);
      try {
        const res = await fetch(`/api/print-meta?nasa_id=${encodeURIComponent(nasa_id)}`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        if (!canceled) {
          setSrcMeta({ width: json.width, height: json.height, format: json.format ?? null });
        }
      } catch (e: any) {
        if (!canceled) setMetaErr(e?.message ?? "Failed to load image metadata");
      } finally {
        if (!canceled) setMetaLoading(false);
      }
    }
    run();
    return () => {
      canceled = true;
    };
  }, [nasa_id]);

  // Clear preview when options change
  useEffect(() => {
    setErr(null);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }, [sizeIdx, dpi, orientation]);

  const downloadHref = useMemo(() => {
    if (!nasa_id) return "#";
    const sp = new URLSearchParams({
      nasa_id,
      w: String(target.w),
      h: String(target.h),
      mode: PRINT_MODE, // <-- ALWAYS contain
      label: `${s.label.replace(/\s+/g, "").replace(/[^\w×x-]/g, "")}_${dpi}dpi_${orientation}_nocrop`,
    });
    return `/api/print?${sp.toString()}`;
  }, [nasa_id, target, s.label, dpi, orientation]);

  const quality = useMemo(() => {
    if (!srcMeta) return null;

    const sw = srcMeta.width;
    const sh = srcMeta.height;

    const scaleW = target.w / sw;
    const scaleH = target.h / sh;

    // Since we force "contain", use MIN scale (fit inside without cropping)
    const neededScale = Math.min(scaleW, scaleH);

    const upscale = Math.max(neededScale, 1);
    const effectiveDpi = Math.round(dpi / upscale);

    const badge = qualityLabel(effectiveDpi);

    return {
      sw,
      sh,
      mp: mp(sw, sh),
      neededScale,
      upscale,
      effectiveDpi,
      badge,
    };
  }, [srcMeta, target, dpi]);

  async function generatePreview() {
    if (!nasa_id) {
      setErr("Missing nasa_id in URL.");
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      const res = await fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nasa_id,
          w: previewDims.w,
          h: previewDims.h,
          mode: PRINT_MODE, // <-- ALWAYS contain (no crop)
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Preview failed: ${res.status} ${text}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setPreviewUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } catch (e: any) {
      setErr(e?.message ?? "Preview failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={nasa_id ? `/image/${nasa_id}` : "/"}
          className="text-sm text-zinc-600 hover:text-zinc-900"
        >
          ← Back
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-zinc-900">Print / Poster</h1>
      <p className="text-sm text-zinc-600">
        No-crop mode: the full image is preserved and fit inside the selected poster size (adds a white border if needed).
      </p>

      <div className="grid gap-4 md:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-black/5 bg-white p-4 space-y-4">
          <div>
            <label className="text-sm text-zinc-700">Size</label>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
              value={sizeIdx}
              onChange={(e) => setSizeIdx(Number(e.target.value))}
            >
              {SIZES.map((x, idx) => (
                <option key={x.label} value={idx}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-zinc-700">DPI</label>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
              value={dpi}
              onChange={(e) => setDpi(Number(e.target.value) as any)}
            >
              {DPIS.map((d) => (
                <option key={d} value={d}>
                  {d} DPI
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-zinc-700">Orientation</label>
            <select
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          {/* Quality Check */}
          <div className="rounded-2xl border border-black/10 bg-zinc-50 p-4 space-y-2">
            <p className="text-sm font-medium text-zinc-900">Print quality check</p>

            {metaLoading ? (
              <p className="text-sm text-zinc-600">Checking source quality…</p>
            ) : metaErr ? (
              <p className="text-sm text-red-600">{metaErr}</p>
            ) : quality ? (
              <>
                <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${quality.badge.color}`}>
                  {quality.badge.label}
                </div>

                <p className="text-sm text-zinc-700">
                  Source: <span className="font-medium">{quality.sw}×{quality.sh}</span> ({quality.mp} MP)
                </p>

                <p className="text-sm text-zinc-700">
                  Target: <span className="font-medium">{target.w}×{target.h}</span> px ({target.wIn}×{target.hIn} in @ {dpi} DPI)
                </p>

                {quality.upscale > 1.01 ? (
                  <p className="text-sm text-zinc-700">
                    Upscaling required: <span className="font-medium">{quality.upscale.toFixed(2)}×</span> → estimated effective DPI{" "}
                    <span className="font-medium">{quality.effectiveDpi}</span>
                  </p>
                ) : (
                  <p className="text-sm text-zinc-700">No upscaling required at {dpi} DPI.</p>
                )}

                {quality.effectiveDpi < 150 ? (
                  <p className="text-sm text-red-700">
                    This may look soft at this size. Try a smaller size or 200 DPI.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-zinc-600">No metadata available.</p>
            )}
          </div>

          <button
            onClick={generatePreview}
            disabled={loading}
            className="w-full rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate preview"}
          </button>

          {previewUrl ? (
            <a
              href={downloadHref}
              className="block text-center w-full rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Download print JPG (no crop)
            </a>
          ) : null}

          {err ? <p className="text-sm text-red-600">{err}</p> : null}
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-4">
          <p className="text-sm text-zinc-700 mb-3">Preview</p>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Print preview"
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