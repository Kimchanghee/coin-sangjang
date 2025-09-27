"use client";

import type { ReactNode } from "react";

import { LanguageSwitcher } from "./LanguageSwitcher";
import type { Locale } from "@/i18n/locales";

interface ResponsiveShellProps {
  banner: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  locale: Locale;
  switchableLocales?: Locale[];
}

export function ResponsiveShell({
  banner,
  children,
  sidebar,
  locale,
  switchableLocales,
}: ResponsiveShellProps) {
  const toolbar = switchableLocales && switchableLocales.length > 0
    ? (
        <LanguageSwitcher currentLocale={locale} focusLocales={switchableLocales} />
      )
    : null;

  return (
    <div className="min-h-screen bg-slate-950/90 p-4 text-slate-100 lg:grid lg:grid-cols-[320px_1fr] lg:items-start lg:gap-8 lg:p-10">
      <aside className="space-y-6">
        <div className="rounded-2xl bg-slate-900/70 p-6 shadow-lg backdrop-blur">
          {banner}
        </div>
        {sidebar && <div className="hidden space-y-6 lg:block">{sidebar}</div>}
      </aside>
      <div className="flex flex-col gap-6 lg:gap-8">
        {toolbar && <div className="flex justify-center lg:justify-end">{toolbar}</div>}
        <main className="space-y-6 lg:max-h-[calc(100vh-6.5rem)] lg:space-y-8 lg:overflow-y-auto lg:pr-2">
          {children}
        </main>
        {sidebar && <aside className="space-y-4 pb-10 lg:hidden">{sidebar}</aside>}
      </div>
    </div>
  );
}


