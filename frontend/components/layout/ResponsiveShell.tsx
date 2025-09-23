"use client";
import { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(max-width: 1023px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };
    
    handleChange(mq);
    mq.addEventListener("change", handleChange as (event: MediaQueryListEvent) => void);
    
    return () => mq.removeEventListener("change", handleChange as (event: MediaQueryListEvent) => void);
  }, []);

  const toolbar = (
    <LanguageSwitcher currentLocale={locale} focusLocales={switchableLocales} />
  );

  if (isMobile) {
    return (
      <MobileLayout banner={banner} sidebar={sidebar} toolbar={toolbar}>
        {children}
      </MobileLayout>
    );
  }

  return (
    <DesktopLayout banner={banner} sidebar={sidebar} toolbar={toolbar}>
      {children}
    </DesktopLayout>
  );
}