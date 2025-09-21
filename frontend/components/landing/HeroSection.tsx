interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
}

export function HeroSection({ title, subtitle, ctaLabel }: HeroSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
      <h1 className="text-3xl font-bold text-slate-50 md:text-4xl">{title}</h1>
      <p className="text-base text-slate-200 md:text-lg">{subtitle}</p>
      <button className="rounded-md bg-emerald-500 px-6 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
        {ctaLabel}
      </button>
    </section>
  );
}
