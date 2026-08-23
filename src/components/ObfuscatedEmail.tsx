"use client";

import { useEffect, useRef } from "react";

// Setzt die E-Mail-Adresse erst nach dem Laden im Browser per DOM-Zugriff
// zusammen (keine React-State-Zwischenstufe), damit weder die Adresse noch
// ein mailto-Link im statischen HTML-Quelltext stehen und von einfachen
// Adress-Scrapern nicht automatisiert ausgelesen werden können.
export function ObfuscatedEmail({ user, domain }: { user: string; domain: string }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const address = `${user}@${domain}`;
    const el = ref.current;
    if (!el) return;
    el.href = `mailto:${address}`;
    el.textContent = address;
  }, [user, domain]);

  return (
    <a ref={ref} className="text-orange-600 hover:underline">
      E-Mail-Adresse wird geladen…
    </a>
  );
}
