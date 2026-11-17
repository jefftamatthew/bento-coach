import type { Macros } from "@/lib/schema";

// While `loading`, numbers show as "–" so the card keeps its size without claiming a value.
export function MacroRing({ eaten, goal, loading = false }: { eaten: Macros; goal: Macros; loading?: boolean }) {
  const pct = !loading && goal.kcal > 0 ? eaten.kcal / goal.kcal : 0;
  const over = pct > 1;
  const r = 52;
  const c = 2 * Math.PI * r;
  const left = Math.round(goal.kcal - eaten.kcal);

  return (
    <div className="rounded-3xl border border-line bg-card p-5 shadow-sm" aria-busy={loading}>
      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={over ? "var(--warn)" : "var(--accent)"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - Math.min(pct, 1))}
              className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums">{loading ? "–" : Math.abs(left)}</span>
            <span className="text-xs text-muted">{over ? "kcal over" : "kcal left"}</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <Bar label="Protein" value={eaten.protein_g} goal={goal.protein_g} color="var(--protein)" loading={loading} />
          <Bar label="Carbs" value={eaten.carbs_g} goal={goal.carbs_g} color="var(--carbs)" loading={loading} />
          <Bar label="Fat" value={eaten.fat_g} goal={goal.fat_g} color="var(--fat)" loading={loading} />
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-muted tabular-nums">
        {loading ? "Loading today…" : `${Math.round(eaten.kcal)} / ${goal.kcal} kcal eaten`}
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  goal,
  color,
  loading,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  loading: boolean;
}) {
  const pct = !loading && goal > 0 ? Math.min(value / goal, 1) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted tabular-nums">{loading ? "–" : `${Math.round(value)}/${goal}g`}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
          style={{ width: `${pct * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}
