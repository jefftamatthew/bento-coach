"use client";

import Link from "next/link";
import { useState } from "react";
import { MacroRing } from "@/components/MacroRing";
import { sumDishes, type GoalPreset } from "@/lib/schema";
import { GOAL_PRESETS, clearDay, deleteMeal, getGoal, getMeals, setGoal } from "@/lib/storage";
import { useHydrated } from "@/lib/useHydrated";

export default function TodayPage() {
  const hydrated = useHydrated();
  const [, setVersion] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const refresh = () => setVersion((v) => v + 1);

  const meals = hydrated ? getMeals() : [];
  const goal = hydrated ? getGoal() : GOAL_PRESETS.maintain;
  const eaten = sumDishes(meals.map((m) => m.totals));

  const dateLabel = hydrated
    ? new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    : " ";

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{dateLabel}</p>
          <h1 className="text-3xl font-bold tracking-tight">Bento Coach</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          className="btn-secondary min-h-11 rounded-full px-4 py-2 text-sm font-medium"
          aria-expanded={showSettings}
        >
          {hydrated ? `Goal: ${GOAL_PRESETS[goal.preset]?.label ?? "Custom"}` : "Goal"}
        </button>
      </header>

      {showSettings && (
        <section className="space-y-3 rounded-3xl border border-line bg-card p-4">
          <p className="text-sm font-semibold">Daily goal</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(GOAL_PRESETS) as GoalPreset[]).map((p) => {
              const preset = GOAL_PRESETS[p];
              const active = goal.preset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const { label: _label, ...g } = preset;
                    void _label;
                    setGoal(g);
                    refresh();
                  }}
                  aria-pressed={active}
                  className={`rounded-2xl border p-3 text-left text-sm transition-transform active:scale-[0.98] ${
                    active ? "border-accent bg-accent-soft" : "border-line hover:border-accent"
                  }`}
                >
                  <span className="block font-semibold">{preset.label}</span>
                  <span className="block text-xs text-muted tabular-nums">
                    {preset.kcal} kcal · {preset.protein_g}g P
                  </span>
                </button>
              );
            })}
          </div>
          {meals.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all of today's meals?")) {
                  clearDay();
                  refresh();
                }
              }}
              className="min-h-11 text-sm font-medium text-warn-ink hover:underline"
            >
              Reset today
            </button>
          )}
        </section>
      )}

      <MacroRing eaten={eaten} goal={goal} loading={!hydrated} />

      <Link
        href="/scan"
        className="btn-primary flex items-center justify-center rounded-full py-4 text-lg font-semibold shadow-md"
      >
        Scan a meal
      </Link>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Today&apos;s meals</h2>
        {!hydrated ? (
          <p className="p-6 text-center text-sm text-muted" aria-busy="true">
            Loading today&apos;s meals…
          </p>
        ) : meals.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Nothing logged yet. Snap your breakfast, a 便當, or that bubble tea.
          </p>
        ) : (
          <ul className="space-y-3">
            {meals.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-3xl border border-line bg-card p-3">
                {m.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.thumbnail} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-line" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.name}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {new Date(m.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} ·{" "}
                    {Math.round(m.totals.kcal)} kcal · P {Math.round(m.totals.protein_g)}g · C{" "}
                    {Math.round(m.totals.carbs_g)}g · F {Math.round(m.totals.fat_g)}g
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deleteMeal(m.id);
                    refresh();
                  }}
                  aria-label={`Delete ${m.name}`}
                  className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl leading-none text-muted hover:bg-warn-soft hover:text-warn-ink"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
