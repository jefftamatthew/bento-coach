"use client";

import { useState } from "react";
import { formatScale, SCALE_MAX, SCALE_MIN, SCALE_STEP, type Dish } from "@/lib/schema";

const confStyle: Record<Dish["confidence"], string> = {
  high: "bg-accent-soft text-accent",
  medium: "bg-line text-muted",
  low: "bg-warn-soft text-warn",
};

type Editing = {
  scales: number[];
  onScale: (index: number, scale: number) => void;
  onRename: (index: number, name: string) => void;
  onRemove: (index: number) => void;
};

export function DishList({ dishes, editing }: { dishes: Dish[]; editing?: Editing }) {
  return (
    <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
      {dishes.map((d, i) => (
        <li key={i} className="flex items-start gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              {editing ? (
                <DishName name={d.name} onRename={(name) => editing.onRename(i, name)} />
              ) : (
                <span className="font-semibold">{d.name}</span>
              )}
              {d.local_name && <span className="text-sm text-muted">{d.local_name}</span>}
            </div>
            <div className="mt-0.5 text-xs text-muted">{d.portion}</div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums">
              <span className="font-semibold">{Math.round(d.kcal)} kcal</span>
              <span style={{ color: "var(--protein)" }}>P {Math.round(d.protein_g)}g</span>
              <span style={{ color: "var(--carbs)" }}>C {Math.round(d.carbs_g)}g</span>
              <span style={{ color: "var(--fat)" }}>F {Math.round(d.fat_g)}g</span>
              <span className={`rounded-full px-2 ${confStyle[d.confidence]}`}>{d.confidence} confidence</span>
            </div>
            {editing && (
              <PortionStepper
                name={d.name}
                scale={editing.scales[i] ?? 1}
                onChange={(s) => editing.onScale(i, s)}
              />
            )}
          </div>
          {editing && (
            <button
              type="button"
              onClick={() => editing.onRemove(i)}
              aria-label={`Remove ${d.name}`}
              className="rounded-full px-2 text-xl leading-none text-muted hover:text-warn"
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function DishName({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);

  if (draft === null) {
    return (
      <button
        type="button"
        onClick={() => setDraft(name)}
        aria-label={`Rename ${name}`}
        className="group text-left font-semibold"
      >
        {name}
        <span className="ml-1 text-xs font-normal text-muted group-hover:text-accent">✎</span>
      </button>
    );
  }

  const commit = () => {
    if (draft.trim()) onRename(draft.trim());
    setDraft(null);
  };

  return (
    <input
      autoFocus
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setDraft(null);
      }}
      aria-label="Dish name"
      maxLength={60}
      className="w-full rounded-lg border border-line bg-transparent px-2 py-1 font-semibold outline-none focus:border-accent"
    />
  );
}

function PortionStepper({ name, scale, onChange }: { name: string; scale: number; onChange: (s: number) => void }) {
  const btn =
    "h-7 w-7 rounded-full border border-line bg-card text-base leading-none disabled:opacity-30 hover:border-accent";
  return (
    <div className="mt-3 flex items-center gap-2 text-xs">
      <span className="text-muted">Portion</span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(scale - SCALE_STEP)}
        disabled={scale <= SCALE_MIN}
        aria-label={`Less ${name}`}
      >
        −
      </button>
      <span
        className={`min-w-10 text-center font-semibold tabular-nums ${scale !== 1 ? "text-accent" : ""}`}
        aria-live="polite"
      >
        {formatScale(scale)}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(scale + SCALE_STEP)}
        disabled={scale >= SCALE_MAX}
        aria-label={`More ${name}`}
      >
        +
      </button>
      {scale !== 1 && (
        <button type="button" onClick={() => onChange(1)} className="ml-1 text-muted underline hover:text-accent">
          reset
        </button>
      )}
    </div>
  );
}
