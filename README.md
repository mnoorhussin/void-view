````md
# VoidView — Space Image Gallery + Wallpaper + Print Generator

VoidView is a fast, minimal space-image gallery powered by NASA’s public image library, featuring:

- **Device-fit wallpapers** (blur fill / crop / fit)
- **Print / poster exports** (print sizes, DPI, no-crop mode)
- **SEO-friendly category browsing** with clean, paginated URLs

Live: **https://voidview.space**

---

## What makes VoidView unique

Most “space wallpaper” sites are just image dumps. VoidView adds real utility:

- A **Fit to Device** generator for wallpapers
- A **Print / Poster mode** that exports _print-ready_ files
- A **Print Quality Check** that estimates whether a chosen print size will look sharp

---

## Features

### Explore (SEO-Friendly)

- **Clean category URLs**: `/c/nebulae/1`, `/c/galaxies/2`, etc.
- **24 images per page** (stable pagination; crawlable)
- **Featured** behaves like a category:
  - `/` = Featured page 1 (canonical)
  - `/c/featured/2+` = Featured pages

### Image Pages

- Dedicated **image detail page** per `nasa_id`
- Title + description (when available)
- Actions:
  - **Fit to Device**
  - **Print / Poster**

### Fit to Device (Wallpaper Generator)

- Presets for phone/desktop/ultrawide
- Modes:
  - **Blur fill** (recommended)
  - **Crop / cover**
  - **Fit / contain**
- Generates a downloadable JPG via server-side rendering (`sharp`)
- Download button can be hidden until preview is generated (UX-friendly)

### Print / Poster Mode (Monetization-ready)

- Export to common print sizes (e.g. 12×18, 18×24, 24×36)
- DPI choices (200 / 300)
- **No-crop print mode** (image fits inside poster size, adds white margins when needed)
- Server-side print rendering with `sharp`
- **Print Quality Check**
  - Reads source pixel dimensions
  - Estimates effective DPI / upscaling requirement
  - Warns when output may be soft at the chosen size

### Trust & Compliance Pages

- `/privacy` (Privacy Policy)
- `/terms` (Terms)
- `/contact` (Contact)
- `/about` (About)
- Simple, non-invasive cookie consent banner (starter)

### SEO Infrastructure

- `robots.txt` via App Router metadata
- `sitemap.xml` includes `/c/<slug>/<page>` for first N pages per category
- Canonical metadata per category page (`/c/[cat]/[page]`)

---

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS (clean, Apple-like UI)
- **Images:** `next/image`
- **Image Processing:** `sharp` (wallpaper + print generation)
- **Data Source:** NASA Images & Video Library API
  - Search: `https://images-api.nasa.gov/search`
  - Assets: `https://images-api.nasa.gov/asset/:nasa_id`
- **Deployment:** Vercel

---

## Important Routes

### Category browsing

- `/` (Featured page 1)
- `/c/:cat/:page` (paginated categories)
  - Example: `/c/nebulae/2`

### APIs

- `GET /api/feed?cat=nebulae&page=1` — category feed (24 items)
- `GET /api/wallpaper?...` / `POST /api/wallpaper` — wallpaper generator
- `GET /api/print?...` / `POST /api/print` — print/poster generator
- `GET /api/print-meta?nasa_id=...` — source dimension lookup for print quality check

---

## Local Development

### Install

```bash
npm install
```
````

### Run

```bash
npm run dev
```

Open:

- http://localhost:3000

---

## Environment Variables

Create `.env.local`:

```env
# NASA Images API does not require a key. Keep if you later add APOD or other NASA endpoints.
NASA_API_KEY=
NEXT_PUBLIC_SITE_URL=
```

> Tip: In development, you usually don’t need `NEXT_PUBLIC_SITE_URL`. On Vercel, set it to `https://voidview.space` if you want absolute canonical URLs in metadata.

---

## Notes / Disclaimer

- VoidView is **not affiliated with NASA**.
- Images and metadata come from public sources; credits belong to their respective owners.
- For print monetization, always show attribution/credits and consider reviewing NASA/partner usage guidelines.

---

## Roadmap Ideas

- Search (keyword + filters: portrait-friendly, ultrawide, 4K)
- Favorites/collections + share links
- “Weekly wallpaper pack” downloads + email list
- Print-on-demand integration (Printful / Gelato / Printify)
- Consent Mode v2 / CMP integration (for EU/UK ad compliance)

---

## License

MIT

```

```
