import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-gray-300 bg-white px-4 py-3 text-center text-xs text-gray-500">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Link href="/datenschutz" className="hover:underline">
          Datenschutzhinweise
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/impressum" className="hover:underline">
          Impressum
        </Link>
      </div>
      <p className="mt-1">© Kurz Intelligence - Reutlingen · Abo-Tracker v0.71</p>
    </footer>
  );
}
