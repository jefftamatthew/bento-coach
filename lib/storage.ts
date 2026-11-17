import type { Goal, GoalPreset, Meal } from "./schema";

const MEALS_KEY = "bento-coach:meals";
const GOAL_KEY = "bento-coach:goal";

export const GOAL_PRESETS: Record<GoalPreset, Goal & { label: string }> = {
  lose: { preset: "lose", label: "Lose weight", kcal: 1700, protein_g: 110, carbs_g: 180, fat_g: 55 },
  maintain: { preset: "maintain", label: "Maintain", kcal: 2100, protein_g: 90, carbs_g: 260, fat_g: 70 },
  muscle: { preset: "muscle", label: "Build muscle", kcal: 2500, protein_g: 150, carbs_g: 300, fat_g: 75 },
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // storage full or blocked: the app still works for this session
    return false;
  }
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` key that is a real date and not in the future, or null. */
export function parseDay(value: string | null | undefined): string | null {
  if (!value || !DAY_RE.test(value)) return null;
  const d = dayToDate(value);
  if (Number.isNaN(d.getTime()) || todayKey(d) !== value) return null;
  return value <= todayKey() ? value : null;
}

/** Local midnight of a `YYYY-MM-DD` key. */
export function dayToDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  const d = dayToDate(day);
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

type MealsByDay = Record<string, Meal[]>;

/** Days that have at least one meal logged. */
export function daysWithMeals(): Set<string> {
  const all = read<MealsByDay>(MEALS_KEY, {});
  return new Set(Object.keys(all).filter((d) => all[d]?.length));
}

export function getMeal(id: string, day = todayKey()): Meal | undefined {
  return getMeals(day).find((m) => m.id === id);
}

export function updateMeal(id: string, day: string, patch: Partial<Omit<Meal, "id">>) {
  const all = read<MealsByDay>(MEALS_KEY, {});
  all[day] = (all[day] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m));
  write(MEALS_KEY, all);
}

export function getMeals(day = todayKey()): Meal[] {
  return read<MealsByDay>(MEALS_KEY, {})[day] ?? [];
}

export function addMeal(meal: Meal, day = todayKey()) {
  const all = read<MealsByDay>(MEALS_KEY, {});
  all[day] = [...(all[day] ?? []), meal];
  if (write(MEALS_KEY, all)) return;
  // Storage is full: the photo is the big part, so keep the meal without it rather than losing it.
  all[day] = [...all[day].slice(0, -1), { ...meal, thumbnail: undefined }];
  write(MEALS_KEY, all);
}

export function deleteMeal(id: string, day = todayKey()) {
  const all = read<MealsByDay>(MEALS_KEY, {});
  all[day] = (all[day] ?? []).filter((m) => m.id !== id);
  write(MEALS_KEY, all);
}

export function clearDay(day = todayKey()) {
  const all = read<MealsByDay>(MEALS_KEY, {});
  delete all[day];
  write(MEALS_KEY, all);
}

export function getGoal(): Goal {
  return read<Goal>(GOAL_KEY, GOAL_PRESETS.maintain);
}

export function setGoal(goal: Goal) {
  write(GOAL_KEY, goal);
}
