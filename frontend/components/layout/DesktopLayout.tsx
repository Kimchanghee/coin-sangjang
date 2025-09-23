import type { ReactNode } from "react";

interface DesktopLayoutProps {
  banner: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  toolbar?: ReactNode;
}

export function DesktopLayout({
  banner,
  children,
  sidebar,
  toolbar,
}: DesktopLayoutProps) {
  return (
    <div className="hidden min-h-screen grid-cols-[320px_1fr] gap-8 bg-slate-950/90 p-10 text-slate-100 lg:grid">
      <aside className="space-y-6">
        <div className="rounded-2xl bg-slate-900/70 p-6 shadow-lg backdrop-blur">
          {banner}
        </div>
        {sidebar}
      </aside>
      <main className="space-y-8 overflow-y-auto pr-2">
        {toolbar && <div className="flex justify-end">{toolbar}</div>}
        {children}
      </main>
    </div>
  );
}
