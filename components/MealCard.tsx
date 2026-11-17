"use client";

import Link from "next/link";
import { MealMenu } from "@/components/MealMenu";
import { MEAL_TYPE_LABEL, mealTypeOf, type Macros, type Meal, type MealType } from "@/lib/schema";

const MACROS = [
  { key: "protein_g", label: "Protein", fill: "var(--protein)", ink: "var(--protein-ink)" },
  { key: "carbs_g", label: "Carbs", fill: "var(--carbs)", ink: "var(--carbs-ink)" },
  { key: "fat_g", label: "Fat", fill: "var(--fat)", ink: "var(--fat-ink)" },
] as const;

export function MealCard({
  meal,
  day,
  goal,
  onMove,
  onDelete,
}: {
  meal: Meal;
  day: string;
  goal: Macros;
  onMove: (type: MealType) => void;
  onDelete: () => void;
}) {
  const type = mealTypeOf(meal);
  const time = new Date(meal.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <li className="rounded-3xl border border-line bg-card p-3">
      <div className="flex items-center gap-3">
        <Link
          href={`/meal/${meal.id}?day=${day}`}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl"
        >
          {meal.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meal.thumbnail} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
          ) : (
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-line" />
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold decoration-accent underline-offset-4 group-hover:underline">
              {meal.name}
            </p>
            <p className="text-xs text-muted tabular-nums">
              <span className="font-semibold text-ink">{Math.round(meal.totals.kcal)} kcal</span> ·{" "}
              {MEAL_TYPE_LABEL[type]} · {time}
            </p>
          </div>
        </Link>
        <MealMenu mealName={meal.name} mealType={type} onMove={onMove} onDelete={onDelete} />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
        {MACROS.map((m) => {
          const grams = meal.totals[m.key];
          const pct = goal[m.key] > 0 ? Math.min(grams / goal[m.key], 1) : 0;
          return (
            <div key={m.key} className="flex items-center gap-2.5">
              <div aria-hidden className="relative h-9 w-1.5 shrink-0 overflow-hidden rounded-full bg-line">
                <div
                  className="absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-700 motion-reduce:transition-none"
                  style={{ height: `${pct * 100}%`, background: m.fill }}
                />
              </div>
              <div className="flex flex-col-reverse">
                <dt className="text-xs text-muted">
                  {m.label}
                  <span className="sr-only">, {Math.round((grams / (goal[m.key] || 1)) * 100)}% of daily goal</span>
                </dt>
                <dd className="font-bold tabular-nums" style={{ color: m.ink }}>
                  {Math.round(grams)}g
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
    </li>
  );
}
