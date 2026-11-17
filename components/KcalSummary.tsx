import type { Macros } from "@/lib/schema";

/** kcal as the one big number, with protein, carbs and fat smaller to its right. */
export function KcalSummary({ totals }: { totals: Macros }) {
  return (
    <div className="flex items-end justify-between gap-4 rounded-3xl border border-line bg-card p-4">
      <p className="leading-none">
        <span className="block text-5xl font-bold tabular-nums">{Math.round(totals.kcal)}</span>
        <span className="mt-1 block text-sm text-muted">kcal</span>
      </p>
      <dl className="grid grid-cols-3 gap-4 text-right">
        <Macro label="protein" value={totals.protein_g} color="var(--protein-ink)" />
        <Macro label="carbs" value={totals.carbs_g} color="var(--carbs-ink)" />
        <Macro label="fat" value={totals.fat_g} color="var(--fat-ink)" />
      </dl>
    </div>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-lg font-bold tabular-nums" style={{ color }}>
        {Math.round(value)}g
      </dd>
    </div>
  );
}
