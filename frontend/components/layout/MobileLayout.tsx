import type { ReactNode } from "react";

interface MobileLayoutProps {
  banner: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
}

export function MobileLayout({ banner, children, sidebar }: MobileLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-slate-950/95 p-4 text-slate-100 lg:hidden">
      <div className="rounded-2xl bg-slate-900/70 p-5 shadow-lg backdrop-blur">
        {banner}
      </div>
      <main className="space-y-6">{children}</main>
      {sidebar && <aside className="space-y-4 pb-10">{sidebar}</aside>}
    </div>
  );
}
