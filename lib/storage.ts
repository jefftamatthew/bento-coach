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

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked: the app still works for this session
  }
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type MealsByDay = Record<string, Meal[]>;

export function getMeals(day = todayKey()): Meal[] {
  return read<MealsByDay>(MEALS_KEY, {})[day] ?? [];
}

export function addMeal(meal: Meal, day = todayKey()) {
  const all = read<MealsByDay>(MEALS_KEY, {});
  all[day] = [...(all[day] ?? []), meal];
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
