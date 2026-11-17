import type { Macros, Suggestion } from "@/lib/schema";

function fmt(n: number, unit: string) {
  const v = Math.round(n);
  if (v === 0) return null;
  return `${v > 0 ? "+" : "−"}${Math.abs(v)}${unit}`;
}

function DeltaChips({ delta }: { delta: Macros }) {
  const chips = [
    { text: fmt(delta.kcal, " kcal"), color: "var(--ink)" },
    { text: fmt(delta.protein_g, "g protein"), color: "var(--protein-ink)" },
    { text: fmt(delta.carbs_g, "g carbs"), color: "var(--carbs-ink)" },
    { text: fmt(delta.fat_g, "g fat"), color: "var(--fat-ink)" },
  ].filter((c) => c.text);
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span
          key={c.text}
          className="rounded-full border border-line bg-card px-2 py-0.5 text-xs font-medium tabular-nums"
          style={{ color: c.color }}
        >
          {c.text}
        </span>
      ))}
    </div>
  );
}

export function CoachCard({ verdict, suggestions }: { verdict: string; suggestions: Suggestion[] }) {
  return (
    <section className="rounded-3xl bg-accent-soft p-5">
      <h3 className="text-sm font-semibold text-accent-ink">Coach</h3>
      <p className="mt-2 text-lg font-semibold leading-snug">{verdict}</p>
      {suggestions.length > 0 && (
        <ol className="mt-4 space-y-3">
          {suggestions.map((s, i) => (
            <li key={i} className="rounded-2xl bg-card p-4">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{s.action}</p>
                  <p className="mt-0.5 text-sm text-muted">{s.reason}</p>
                  <DeltaChips delta={s.delta} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
