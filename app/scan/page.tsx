"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { CoachCard } from "@/components/CoachCard";
import { DishList } from "@/components/DishList";
import { KcalSummary } from "@/components/KcalSummary";
import type { Shot } from "@/lib/image";
import {
  MEAL_TYPES,
  applyEdit,
  guessMealType,
  sumDishes,
  type Analysis,
  type AnalyzeRequest,
  type DishEdit,
  type MealType,
} from "@/lib/schema";
import { addMeal, dayToDate, getGoal, getMeals, parseDay, todayKey } from "@/lib/storage";

const TYPICAL_TIME: Record<MealType, [number, number]> = {
  breakfast: [8, 0],
  lunch: [12, 30],
  dinner: [18, 30],
  snack: [15, 30],
};

/** The day to log into: `?day=` from the home screen's date strip, else today. Only read in the browser. */
function targetDay(): string {
  return parseDay(new URLSearchParams(window.location.search).get("day")) ?? todayKey();
}

type State =
  | { step: "capture" }
  | { step: "analyzing"; shot: Shot }
  // `edits` runs parallel to `analysis.dishes`: the model's estimate stays untouched so scaling never compounds.
  | { step: "result"; shot: Shot; analysis: Analysis; edits: DishEdit[]; mealType: MealType; demo?: boolean }
  | { step: "error"; shot: Shot; error: string };

export default function ScanPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: "capture" });

  async function analyze(shot: Shot) {
    setState({ step: "analyzing", shot });
    const meals = getMeals(targetDay());
    const goal = getGoal();
    const body: AnalyzeRequest = {
      image: shot.base64,
      eatenToday: sumDishes(meals.map((m) => m.totals)),
      goal: { kcal: goal.kcal, protein_g: goal.protein_g, carbs_g: goal.carbs_g, fat_g: goal.fat_g },
      mealsToday: meals.map((m) => m.name),
    };
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({ error: "Unexpected server response." }));
      if (!res.ok) throw new Error(data.error ?? "Analysis failed.");
      const analysis = data as Analysis;
      setState({
        step: "result",
        shot,
        analysis,
        edits: analysis.dishes.map((d) => ({ name: d.name, scale: 1 })),
        mealType: guessMealType(new Date()),
        demo: data.demo === true,
      });
    } catch (err) {
      setState({ step: "error", shot, error: err instanceof Error ? err.message : "Analysis failed." });
    }
  }

  function save() {
    if (state.step !== "result") return;
    const { analysis, edits, shot, mealType } = state;
    const dishes = analysis.dishes.map((d, i) => applyEdit(d, edits[i]));
    const day = targetDay();
    // Today: when it was scanned. An earlier day: a typical time for that meal, so the day's list sorts sensibly.
    const time = day === todayKey() ? new Date() : dayToDate(day);
    if (day !== todayKey()) time.setHours(...TYPICAL_TIME[mealType]);
    const id = crypto.randomUUID();
    addMeal(
      {
        id,
        time: time.toISOString(),
        name: analysis.meal_name,
        dishes,
        totals: sumDishes(dishes),
        thumbnail: shot.thumbnail,
        mealType,
        verdict: analysis.verdict,
        suggestions: analysis.suggestions,
      },
      day,
    );
    router.push(day === todayKey() ? "/" : `/?day=${day}`);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link href="/" className="btn-secondary flex h-11 w-11 items-center justify-center rounded-full text-sm" aria-label="Back">
          ←
        </Link>
        <h1 className="text-xl font-bold">Scan a meal</h1>
      </header>

      {state.step === "capture" && <CameraCapture onShot={analyze} />}

      {state.step !== "capture" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={state.shot.dataUrl}
          alt="Your meal"
          className={`aspect-[4/3] w-full rounded-3xl object-cover ${state.step === "analyzing" ? "animate-pulse motion-reduce:animate-none" : ""}`}
        />
      )}

      {state.step === "analyzing" && (
        <div className="rounded-3xl border border-line bg-card p-6 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-line border-t-accent" />
          <p className="mt-3 font-semibold">Reading your plate…</p>
          <p className="text-sm text-muted">Splitting dishes and estimating portions</p>
        </div>
      )}

      {state.step === "error" && (
        <div className="space-y-3 rounded-3xl bg-warn-soft p-5">
          <p className="font-semibold text-warn-ink">{state.error}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => analyze(state.shot)}
              className="btn-primary min-h-11 rounded-full px-4 py-2 text-sm font-semibold"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => setState({ step: "capture" })}
              className="btn-secondary min-h-11 rounded-full px-4 py-2 text-sm font-semibold"
            >
              Retake
            </button>
          </div>
        </div>
      )}

      {state.step === "result" && <Result state={state} setState={setState} onSave={save} />}
    </div>
  );
}

function Result({
  state,
  setState,
  onSave,
}: {
  state: Extract<State, { step: "result" }>;
  setState: (s: State) => void;
  onSave: () => void;
}) {
  const { analysis, edits } = state;
  const retake = () => setState({ step: "capture" });

  if (!analysis.is_food) {
    return (
      <div className="space-y-3 rounded-3xl bg-warn-soft p-5">
        <p className="font-semibold">No food spotted</p>
        <p className="text-sm text-muted">{analysis.verdict}</p>
        <button
          type="button"
          onClick={retake}
          className="btn-primary min-h-11 rounded-full px-4 py-2 text-sm font-semibold"
        >
          Retake
        </button>
      </div>
    );
  }

  const day = targetDay();
  const saveLabel =
    day === todayKey()
      ? "Save to today"
      : `Save to ${dayToDate(day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const dishes = analysis.dishes.map((d, i) => applyEdit(d, edits[i]));
  const totals = sumDishes(dishes);
  const edited = edits.some((e, i) => e.scale !== 1 || e.name !== analysis.dishes[i].name);
  const original = sumDishes(analysis.dishes);
  const kcalChange = Math.round(totals.kcal - original.kcal);

  const setEdit = (i: number, patch: Partial<DishEdit>) =>
    setState({ ...state, edits: edits.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const removeDish = (i: number) =>
    setState({
      ...state,
      analysis: { ...analysis, dishes: analysis.dishes.filter((_, j) => j !== i) },
      edits: edits.filter((_, j) => j !== i),
    });

  return (
    <div className="space-y-5">
      {state.demo && (
        <p className="rounded-2xl border border-warn bg-warn-soft px-4 py-3 text-sm">
          <span className="font-semibold text-warn-ink">Demo result.</span> No API key is set, so this is a sample meal,
          not your photo. Add <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> to{" "}
          <code className="font-mono text-xs">.env.local</code> for real analysis.
        </p>
      )}
      <div>
        <h2 className="text-2xl font-bold">{analysis.meal_name}</h2>
        <div className="mt-3">
          <KcalSummary totals={totals} />
        </div>
      </div>

      <CoachCard verdict={analysis.verdict} suggestions={analysis.suggestions} />
      {edited && (
        <p className="-mt-3 px-1 text-xs text-muted">
          You adjusted this meal ({kcalChange >= 0 ? "+" : "−"}
          {Math.abs(kcalChange)} kcal vs. the photo estimate). The coach&apos;s tips are based on the original estimate.
        </p>
      )}

      <div>
        <h3 className="text-lg font-semibold">What we see</h3>
        <p className="mb-3 text-sm text-muted">Fix names, portions, or remove mistakes.</p>
        {analysis.dishes.length > 0 ? (
          <DishList
            dishes={dishes}
            editing={{
              scales: edits.map((e) => e.scale),
              onScale: (i, scale) => setEdit(i, { scale }),
              onRename: (i, name) => setEdit(i, { name }),
              onRemove: removeDish,
            }}
          />
        ) : (
          <p className="text-sm text-muted">All items removed.</p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-lg font-semibold">Log as</legend>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((t) => {
            const active = t.id === state.mealType;
            return (
              <label
                key={t.id}
                className={`flex min-h-11 cursor-pointer items-center justify-center rounded-full border text-sm font-medium transition-transform has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent active:scale-[0.98] ${
                  active ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-card hover:border-accent"
                }`}
              >
                <input
                  type="radio"
                  name="meal-type"
                  value={t.id}
                  checked={active}
                  onChange={() => setState({ ...state, mealType: t.id })}
                  className="sr-only"
                />
                {t.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={retake}
          className="btn-secondary flex-1 rounded-full py-3 font-semibold"
        >
          Retake
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={analysis.dishes.length === 0}
          className="btn-primary flex-[2] rounded-full py-3 font-semibold"
        >
          {saveLabel}
        </button>
      </div>
      <p className="text-center text-xs text-muted">Estimates from a photo. Real values can differ by 20% or more.</p>
    </div>
  );
}
