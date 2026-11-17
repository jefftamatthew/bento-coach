import { z } from "zod";

export const MacrosSchema = z.object({
  kcal: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
});

export const DishSchema = z.object({
  name: z.string().describe("Short English name, e.g. 'Braised pork rice'"),
  local_name: z
    .string()
    .describe("Traditional Chinese name if it is a Taiwanese dish, else empty string"),
  portion: z.string().describe("Estimated portion, e.g. '1 bowl (~200g)'"),
  kcal: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  confidence: z.enum(["high", "medium", "low"]),
});

export const SuggestionSchema = z.object({
  action: z.string().describe("Concrete, short action, e.g. 'Add a braised egg (滷蛋)'"),
  reason: z.string().describe("One sentence why it helps today's goal"),
  delta: MacrosSchema.describe("Change to this meal's macros if the user follows it"),
});

export const AnalysisSchema = z.object({
  is_food: z.boolean(),
  meal_name: z.string().describe("Short title for the whole meal, e.g. 'Chicken leg bento'"),
  dishes: z.array(DishSchema),
  verdict: z.string().describe("One short line summing up the meal, e.g. 'Good protein, heavy on oil'"),
  suggestions: z.array(SuggestionSchema).describe("1-2 actionable fixes"),
});

export type Macros = z.infer<typeof MacrosSchema>;
export type Dish = z.infer<typeof DishSchema>;
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;

export type Goal = Macros & { preset: GoalPreset };
export type GoalPreset = "lose" | "maintain" | "muscle";

export type Meal = {
  id: string;
  time: string; // ISO
  name: string;
  dishes: Dish[];
  totals: Macros;
  thumbnail?: string; // small data URL
};

export type AnalyzeRequest = {
  image: string; // base64 JPEG, no data: prefix
  eatenToday: Macros;
  goal: Macros;
  mealsToday: string[];
};

/** A user's correction to one dish the model found. */
export type DishEdit = { name: string; scale: number };

export const SCALE_STEP = 0.5;
export const SCALE_MIN = 0.5;
export const SCALE_MAX = 3;

export function formatScale(scale: number): string {
  const whole = Math.floor(scale);
  const half = scale - whole >= 0.5 ? "½" : "";
  return `${whole || half ? `${whole || ""}${half}` : "0"}×`;
}

/** Apply a user's edit to the model's original estimate, scaling macros by portion. */
export function applyEdit(dish: Dish, edit: DishEdit): Dish {
  const r = (n: number) => Math.round(n * edit.scale * 10) / 10;
  return {
    ...dish,
    name: edit.name.trim() || dish.name,
    // A rename means the local name may no longer match.
    local_name: edit.name.trim() && edit.name.trim() !== dish.name ? "" : dish.local_name,
    portion: edit.scale === 1 ? dish.portion : `${formatScale(edit.scale)} ${dish.portion}`,
    kcal: r(dish.kcal),
    protein_g: r(dish.protein_g),
    carbs_g: r(dish.carbs_g),
    fat_g: r(dish.fat_g),
  };
}

export function sumDishes(dishes: Pick<Dish, keyof Macros>[]): Macros {
  return dishes.reduce(
    (acc, d) => ({
      kcal: acc.kcal + d.kcal,
      protein_g: acc.protein_g + d.protein_g,
      carbs_g: acc.carbs_g + d.carbs_g,
      fat_g: acc.fat_g + d.fat_g,
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}
