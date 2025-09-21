interface BannerSlotProps {
  title: string;
  subtitle: string;
  cta: string;
}

export function BannerSlot({ title, subtitle, cta }: BannerSlotProps) {
  return (
    <div className="flex h-full flex-col justify-between space-y-4 rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-500/20 via-slate-900 to-slate-900 p-6 text-slate-100 shadow-xl">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-slate-200">{subtitle}</p>
      </div>
      <button className="w-full rounded-md bg-sky-500 py-2 font-semibold text-slate-950 transition hover:bg-sky-400">
        {cta}
      </button>
    </div>
  );
}
