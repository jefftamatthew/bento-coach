"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { CoachCard } from "@/components/CoachCard";
import { DishList } from "@/components/DishList";
import { KcalSummary } from "@/components/KcalSummary";
import { MealMenu } from "@/components/MealMenu";
import { MEAL_TYPE_LABEL, mealTypeOf, type Macros } from "@/lib/schema";
import { dayToDate, deleteMeal, getGoal, getMeal, parseDay, todayKey, updateMeal } from "@/lib/storage";
import { useHydrated } from "@/lib/useHydrated";

export default function MealPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MealDetail />
    </Suspense>
  );
}

function Loading() {
  return (
    <p className="p-6 text-center text-sm text-muted" aria-busy="true">
      Loading meal…
    </p>
  );
}

function MealDetail() {
  const hydrated = useHydrated();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const [, setVersion] = useState(0);

  if (!hydrated) return <Loading />;

  const day = parseDay(params.get("day")) ?? todayKey();
  const backHref = day === todayKey() ? "/" : `/?day=${day}`;
  const meal = getMeal(id, day);

  if (!meal) {
    return (
      <div className="space-y-5">
        <BackLink href={backHref} />
        <p className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">
          This meal isn&apos;t in your log anymore.
        </p>
      </div>
    );
  }

  const goal = getGoal();
  const type = mealTypeOf(meal);
  const when = `${dayToDate(day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${new Date(
    meal.time,
  ).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <BackLink href={backHref} />
        <p className="min-w-0 flex-1 truncate text-center text-sm text-muted">
          {MEAL_TYPE_LABEL[type]} · {when}
        </p>
        <MealMenu
          mealName={meal.name}
          mealType={type}
          onMove={(mealType) => {
            updateMeal(meal.id, day, { mealType });
            setVersion((v) => v + 1);
          }}
          onDelete={() => {
            deleteMeal(meal.id, day);
            router.replace(backHref);
          }}
        />
      </header>

      {meal.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meal.thumbnail} alt={`Photo of ${meal.name}`} className="aspect-[4/3] w-full rounded-3xl object-cover" />
      )}

      <div>
        <h1 className="mb-3 text-2xl font-bold">{meal.name}</h1>
        <KcalSummary totals={meal.totals} />
      </div>

      <GoalShare totals={meal.totals} goal={goal} />

      {meal.verdict && <CoachCard verdict={meal.verdict} suggestions={meal.suggestions ?? []} />}

      <section>
        <h2 className="mb-3 text-lg font-semibold">What was on the plate</h2>
        <DishList dishes={meal.dishes} />
      </section>

      <p className="text-center text-xs text-muted">Estimates from a photo. Real values can differ by 20% or more.</p>
    </div>
  );
}

function BackLink({ href }: { href: string }) {
  return (
    <Link href={href} className="btn-secondary flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm" aria-label="Back">
      ←
    </Link>
  );
}

const ROWS = [
  { key: "kcal", label: "Calories", unit: " kcal", fill: "var(--accent)", ink: "var(--ink)" },
  { key: "protein_g", label: "Protein", unit: "g", fill: "var(--protein)", ink: "var(--protein-ink)" },
  { key: "carbs_g", label: "Carbs", unit: "g", fill: "var(--carbs)", ink: "var(--carbs-ink)" },
  { key: "fat_g", label: "Fat", unit: "g", fill: "var(--fat)", ink: "var(--fat-ink)" },
] as const;

/** How much of the daily goal this one meal covers. */
function GoalShare({ totals, goal }: { totals: Macros; goal: Macros }) {
  return (
    <section className="rounded-3xl border border-line bg-card p-5">
      <h2 className="text-lg font-semibold">Share of your day</h2>
      <p className="mb-4 text-sm text-muted">How much of your daily goal this meal covers.</p>
      <ul className="space-y-4">
        {ROWS.map((r) => {
          const value = totals[r.key];
          const target = goal[r.key];
          const pct = target > 0 ? Math.round((value / target) * 100) : 0;
          return (
            <li key={r.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{r.label}</span>
                <span className="tabular-nums">
                  <span className="font-semibold" style={{ color: r.ink }}>
                    {pct}%
                  </span>
                  <span className="text-muted">
                    {" "}
                    · {Math.round(value)} of {target}
                    {r.unit}
                  </span>
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-line"
                role="meter"
                aria-label={`${r.label}: ${pct}% of daily goal`}
                aria-valuenow={Math.min(pct, 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
                  style={{ width: `${Math.min(pct, 100)}%`, background: pct > 100 ? "var(--warn)" : r.fill }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
