"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Consent = "accepted" | "essential";

const KEY = "vv_cookie_consent";

function setConsentCookie(value: Consent) {
  // 180 days
  const maxAge = 60 * 60 * 24 * 180;
  document.cookie = `vv_consent=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // only run client-side
    const existing = window.localStorage.getItem(KEY);
    if (!existing) setShow(true);
  }, []);

  function choose(value: Consent) {
    window.localStorage.setItem(KEY, value);
    setConsentCookie(value);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 md:p-4">
      <div className="mx-auto max-w-6xl rounded-3xl border border-black/10 bg-white/90 backdrop-blur shadow-[0_10px_40px_rgba(0,0,0,0.12)]">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900">Cookies</p>
            <p className="text-sm text-zinc-600">
              We use cookies to operate the site and (optionally) to personalize ads/measure performance.{" "}
              <Link href="/privacy" className="underline hover:text-zinc-900">
                Learn more
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button
              onClick={() => choose("essential")}
              className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Essential only
            </button>
            <button
              onClick={() => choose("accepted")}
              className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}