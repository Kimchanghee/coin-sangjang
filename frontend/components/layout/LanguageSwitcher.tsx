"use client";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/locales";

interface LanguageSwitcherProps {
  currentLocale: Locale;
  focusLocales?: Locale[];
}

const DEFAULT_FOCUS_LOCALES: Locale[] = ["ko", "ja", "en"];

export function LanguageSwitcher({
  currentLocale,
  focusLocales,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const focus = focusLocales ?? DEFAULT_FOCUS_LOCALES;
  const allowedLocales = focus.filter((locale) => locales.includes(locale));
  const visibleLocales = Array.from(
    new Set<Locale>([...(allowedLocales.length ? allowedLocales : []), currentLocale]),
  );

  if (visibleLocales.length <= 1) {
    return null;
  }

  const safePathname = pathname ?? "/";
  const segments = safePathname.split("/").filter(Boolean);
  const potentialLocale = segments[0];
  const matchesKnownLocale = locales.includes(potentialLocale as Locale);
  const restSegments = matchesKnownLocale ? segments.slice(1) : segments;
  const suffix = restSegments.join("/");
  const normalizedPath = (suffix ? `/${suffix}` : "/") as Route;

  return (
    <nav
      aria-label="Language selection"
      className="flex items-center gap-2 rounded-full bg-slate-900/70 p-1 text-xs shadow-sm"
    >
      {visibleLocales.map((locale) => {
        const isActive = locale === currentLocale;
        const label = localeLabels[locale];

        return (
          <Link
            key={locale}
            href={normalizedPath}
            locale={locale}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full px-3 py-1 font-medium transition ${
              isActive
                ? "bg-sky-500 text-slate-950 shadow"
                : "text-slate-200 hover:bg-slate-800/70"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}