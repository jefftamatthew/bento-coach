"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { DateStrip } from "@/components/DateStrip";
import { MacroRing } from "@/components/MacroRing";
import { MealCard } from "@/components/MealCard";
import { MEAL_TYPES, MEAL_TYPE_LABEL, mealTypeOf, sumDishes, type GoalPreset, type MealType } from "@/lib/schema";
import {
  GOAL_PRESETS,
  clearDay,
  dayToDate,
  daysWithMeals,
  deleteMeal,
  getGoal,
  getMeals,
  parseDay,
  setGoal,
  todayKey,
  updateMeal,
} from "@/lib/storage";
import { useHydrated } from "@/lib/useHydrated";

type Filter = MealType | "all";

export default function HomePage() {
  return (
    <Suspense fallback={<Shell />}>
      <Daily />
    </Suspense>
  );
}

/** Same layout as the loaded page, with "–" for numbers, so nothing jumps on load. */
function Shell() {
  return (
    <div className="space-y-6">
      <Header goalLabel="Goal" />
      <div className="h-[8rem]" />
      <MacroRing eaten={{ kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }} goal={GOAL_PRESETS.maintain} loading />
    </div>
  );
}

function Daily() {
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, setVersion] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const refresh = () => setVersion((v) => v + 1);

  if (!hydrated) return <Shell />;

  const today = todayKey();
  const day = parseDay(params.get("day")) ?? today;
  const rawFilter = params.get("meal");
  const filter: Filter = MEAL_TYPES.some((t) => t.id === rawFilter) ? (rawFilter as MealType) : "all";
  const isToday = day === today;

  const navigate = (next: { day?: string; meal?: Filter }) => {
    const q = new URLSearchParams();
    const d = next.day ?? day;
    const m = next.meal ?? filter;
    if (d !== today) q.set("day", d);
    if (m !== "all") q.set("meal", m);
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const meals = getMeals(day).sort((a, b) => a.time.localeCompare(b.time));
  const goal = getGoal();
  const eaten = sumDishes(meals.map((m) => m.totals));
  const counts = Object.fromEntries(MEAL_TYPES.map((t) => [t.id, 0])) as Record<MealType, number>;
  for (const m of meals) counts[mealTypeOf(m)]++;
  const shown = filter === "all" ? meals : meals.filter((m) => mealTypeOf(m) === filter);

  const dayLabel = dayToDate(day).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const shortDay = dayToDate(day).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <Header
        goalLabel={`Goal: ${GOAL_PRESETS[goal.preset]?.label ?? "Custom"}`}
        settingsOpen={showSettings}
        onToggleSettings={() => setShowSettings((s) => !s)}
      />

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
                if (confirm(`Clear all meals on ${isToday ? "today" : shortDay}?`)) {
                  clearDay(day);
                  refresh();
                }
              }}
              className="min-h-11 text-sm font-medium text-warn-ink hover:underline"
            >
              {isToday ? "Reset today" : `Clear ${shortDay}`}
            </button>
          )}
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">{isToday ? `Today · ${dayLabel}` : dayLabel}</p>
          <CalendarPicker day={day} onPick={(d) => navigate({ day: d })} />
        </div>
        <DateStrip selected={day} logged={daysWithMeals()} onSelect={(d) => navigate({ day: d })} />
      </section>

      <MacroRing eaten={eaten} goal={goal} />

      <Link
        href={isToday ? "/scan" : `/scan?day=${day}`}
        className="btn-primary flex items-center justify-center rounded-full py-4 text-lg font-semibold shadow-md"
      >
        {isToday ? "Scan a meal" : `Scan a meal for ${shortDay}`}
      </Link>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{isToday ? "Today's meals" : `Meals on ${shortDay}`}</h2>

        <div
          className="mb-3 flex gap-1 overflow-x-auto rounded-full border border-line bg-card p-1 [scrollbar-width:none]"
          role="group"
          aria-label="Filter by meal"
        >
          {(["all", ...MEAL_TYPES.map((t) => t.id)] as Filter[]).map((f) => {
            const active = f === filter;
            const count = f === "all" ? meals.length : counts[f];
            const name = f === "all" ? "All" : MEAL_TYPE_LABEL[f];
            return (
              <button
                key={f}
                type="button"
                onClick={() => navigate({ meal: f })}
                aria-pressed={active}
                aria-label={`${name}, ${count} logged`}
                className={`relative flex min-h-11 flex-auto items-center justify-center whitespace-nowrap rounded-full px-2 text-sm font-medium transition-colors ${
                  active ? "bg-accent text-on-accent" : count > 0 ? "text-ink hover:bg-accent-soft" : "text-muted hover:text-ink"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {shown.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">
            {meals.length === 0
              ? isToday
                ? "Nothing logged yet. Snap your breakfast, a 便當, or that bubble tea."
                : `Nothing logged on ${shortDay}.`
              : `No ${MEAL_TYPE_LABEL[filter as MealType].toLowerCase()} logged ${isToday ? "today" : `on ${shortDay}`}.`}
          </p>
        ) : (
          <ul className="space-y-3">
            {shown.map((m) => (
              <MealCard
                key={m.id}
                meal={m}
                day={day}
                goal={goal}
                onMove={(mealType) => {
                  updateMeal(m.id, day, { mealType });
                  refresh();
                }}
                onDelete={() => {
                  deleteMeal(m.id, day);
                  refresh();
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Header({
  goalLabel,
  settingsOpen = false,
  onToggleSettings,
}: {
  goalLabel: string;
  settingsOpen?: boolean;
  onToggleSettings?: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3">
      <h1 className="text-3xl font-bold tracking-tight">Bento Coach</h1>
      <button
        type="button"
        onClick={onToggleSettings}
        disabled={!onToggleSettings}
        className="btn-secondary min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-medium"
        aria-expanded={settingsOpen}
      >
        {goalLabel}
      </button>
    </header>
  );
}

/** Calendar button that opens the browser's date picker, for days older than the strip shows. */
function CalendarPicker({ day, onPick }: { day: string; onPick: (day: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          const input = ref.current;
          if (!input) return;
          try {
            input.showPicker();
          } catch {
            input.focus();
          }
        }}
        aria-label="Pick a date from the calendar"
        className="btn-secondary flex h-11 w-11 items-center justify-center rounded-full"
      >
        <CalendarIcon />
      </button>
      <input
        ref={ref}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={day}
        max={todayKey()}
        onChange={(e) => {
          const picked = parseDay(e.target.value);
          if (picked) onPick(picked);
        }}
        className="pointer-events-none absolute inset-0 opacity-0"
      />
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
    >
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}
