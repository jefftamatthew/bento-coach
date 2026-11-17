"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { CoachCard } from "@/components/CoachCard";
import { DishList } from "@/components/DishList";
import type { Shot } from "@/lib/image";
import { applyEdit, sumDishes, type Analysis, type AnalyzeRequest, type DishEdit } from "@/lib/schema";
import { addMeal, getGoal, getMeals } from "@/lib/storage";

type State =
  | { step: "capture" }
  | { step: "analyzing"; shot: Shot }
  // `edits` runs parallel to `analysis.dishes`: the model's estimate stays untouched so scaling never compounds.
  | { step: "result"; shot: Shot; analysis: Analysis; edits: DishEdit[]; demo?: boolean }
  | { step: "error"; shot: Shot; error: string };

export default function ScanPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: "capture" });

  async function analyze(shot: Shot) {
    setState({ step: "analyzing", shot });
    const meals = getMeals();
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
        demo: data.demo === true,
      });
    } catch (err) {
      setState({ step: "error", shot, error: err instanceof Error ? err.message : "Analysis failed." });
    }
  }

  function save() {
    if (state.step !== "result") return;
    const { analysis, edits, shot } = state;
    const dishes = analysis.dishes.map((d, i) => applyEdit(d, edits[i]));
    addMeal({
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
      name: analysis.meal_name,
      dishes,
      totals: sumDishes(dishes),
      thumbnail: shot.thumbnail,
    });
    router.push("/");
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <Link href="/" className="rounded-full border border-line bg-card px-3 py-1.5 text-sm" aria-label="Back">
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
          className={`aspect-[4/3] w-full rounded-3xl object-cover ${state.step === "analyzing" ? "animate-pulse" : ""}`}
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
          <p className="font-semibold text-warn">{state.error}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => analyze(state.shot)}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => setState({ step: "capture" })}
              className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold"
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
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Retake
        </button>
      </div>
    );
  }

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
          <span className="font-semibold text-warn">Demo result.</span> No API key is set, so this is a sample meal,
          not your photo. Add <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> to{" "}
          <code className="font-mono text-xs">.env.local</code> for real analysis.
        </p>
      )}
      <div>
        <h2 className="text-2xl font-bold">{analysis.meal_name}</h2>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          <Stat label="kcal" value={totals.kcal} color="var(--ink)" />
          <Stat label="protein" value={totals.protein_g} unit="g" color="var(--protein)" />
          <Stat label="carbs" value={totals.carbs_g} unit="g" color="var(--carbs)" />
          <Stat label="fat" value={totals.fat_g} unit="g" color="var(--fat)" />
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
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          What we see · fix names, portions, or remove mistakes
        </h3>
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

      <div className="flex gap-3">
        <button
          type="button"
          onClick={retake}
          className="flex-1 rounded-full border border-line bg-card py-3 font-semibold"
        >
          Retake
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={analysis.dishes.length === 0}
          className="flex-[2] rounded-full bg-accent py-3 font-semibold text-white disabled:opacity-50"
        >
          Save to today
        </button>
      </div>
      <p className="text-center text-xs text-muted">Estimates from a photo. Real values can differ by 20% or more.</p>
    </div>
  );
}

function Stat({ label, value, unit = "", color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card py-2">
      <div className="text-lg font-bold tabular-nums" style={{ color }}>
        {Math.round(value)}
        {unit}
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
