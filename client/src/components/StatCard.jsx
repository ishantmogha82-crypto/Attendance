export default function StatCard({ label, value, icon: Icon, accent = "brand", suffix = "" }) {
  const accentMap = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300",
    mint: "bg-mint-500/10 text-mint-600 dark:text-mint-400",
    amber: "bg-amber-500/10 text-amber-500",
    coral: "bg-coral-500/10 text-coral-500",
  };

  return (
    <div className="card flex items-center justify-between p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1.5 font-display text-2xl font-bold text-slate-900 dark:text-white">
          {value}
          {suffix}
        </p>
      </div>
      {Icon && (
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentMap[accent]}`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
}
