export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-ink-700 dark:bg-ink-900">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 dark:bg-ink-800">
          <Icon size={22} />
        </div>
      )}
      <p className="font-display text-base font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-9 flex-1 animate-pulse rounded-lg bg-slate-100 dark:bg-ink-800"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return <div className="h-24 animate-pulse rounded-xl2 bg-slate-100 dark:bg-ink-800" />;
}
