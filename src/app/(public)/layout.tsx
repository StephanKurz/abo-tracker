import { SiteFooter } from "@/components/SiteFooter";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden print:h-auto print:overflow-visible">
      <main className="flex flex-1 items-center justify-center overflow-y-auto p-4">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
