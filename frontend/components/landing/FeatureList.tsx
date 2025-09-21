import type { FeatureItem } from "@/i18n/content/types";

interface FeatureListProps {
  title: string;
  items: FeatureItem[];
}

export function FeatureList({ title, items }: FeatureListProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <header>
        <h2 className="text-xl font-semibold">{title}</h2>
      </header>
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((feature) => (
          <li key={feature.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-xs font-semibold text-sky-400">#{feature.id}</span>
            <h3 className="mt-2 text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
