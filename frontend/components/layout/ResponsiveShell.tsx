"use client";

import type { ReactNode } from "react";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { type Locale } from "@/i18n/locales";

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
  const Toolbar = () => (
    <LanguageSwitcher currentLocale={locale} focusLocales={switchableLocales} />
  );

  return (
    <>
      <MobileLayout banner={banner} sidebar={sidebar} toolbar={<Toolbar />}>
        {children}
      </MobileLayout>
      <DesktopLayout banner={banner} sidebar={sidebar} toolbar={<Toolbar />}>
        {children}
      </DesktopLayout>
    </>
  );
}
