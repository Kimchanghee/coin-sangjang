import type { UsageGuide } from "@/i18n/content/types";

interface UsageGuideSectionProps {
  title: string;
  copy: UsageGuide;
}

export function UsageGuideSection({ title, copy }: UsageGuideSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-slate-200">{copy.intro}</p>
        <p className="text-sm text-slate-300">{copy.rationale}</p>
      </header>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-200">
        {copy.steps.map((step, index) => (
          <li key={index} className="leading-relaxed">
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
