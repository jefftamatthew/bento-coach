import type { Analysis } from "./schema";

/** Sample results returned when no API key is set, so the full flow can be tried. */
export const DEMO_RESULTS: Analysis[] = [
  {
    is_food: true,
    meal_name: "Fried chicken leg bento",
    dishes: [
      { name: "White rice", local_name: "白飯", portion: "1 full box portion (~250g)", kcal: 350, protein_g: 6, carbs_g: 78, fat_g: 1, confidence: "high" },
      { name: "Fried chicken leg", local_name: "炸雞腿", portion: "1 leg with skin (~180g)", kcal: 430, protein_g: 32, carbs_g: 12, fat_g: 28, confidence: "high" },
      { name: "Stir-fried cabbage", local_name: "炒高麗菜", portion: "1 side (~80g)", kcal: 60, protein_g: 1, carbs_g: 5, fat_g: 4, confidence: "medium" },
      { name: "Braised tofu", local_name: "滷豆腐", portion: "2 pieces (~70g)", kcal: 90, protein_g: 7, carbs_g: 3, fat_g: 6, confidence: "medium" },
      { name: "Pickled mustard greens", local_name: "酸菜", portion: "small spoonful (~20g)", kcal: 15, protein_g: 0, carbs_g: 2, fat_g: 1, confidence: "low" },
    ],
    verdict: "Solid protein, but the rice and fried skin push it heavy.",
    suggestions: [
      {
        action: "Ask for half rice (飯少)",
        reason: "Cuts a lot of carbs and calories while keeping you full with the chicken and tofu.",
        delta: { kcal: -175, protein_g: -3, carbs_g: -39, fat_g: 0 },
      },
      {
        action: "Peel off most of the fried skin",
        reason: "Most of the fat is in the batter and skin; the meat keeps the protein.",
        delta: { kcal: -120, protein_g: -2, carbs_g: -6, fat_g: -11 },
      },
    ],
  },
  {
    is_food: true,
    meal_name: "Braised pork rice with soup",
    dishes: [
      { name: "Braised pork rice", local_name: "滷肉飯", portion: "1 small bowl (~200g)", kcal: 420, protein_g: 11, carbs_g: 58, fat_g: 16, confidence: "high" },
      { name: "Blanched greens", local_name: "燙青菜", portion: "1 plate (~100g) with meat sauce", kcal: 70, protein_g: 2, carbs_g: 5, fat_g: 5, confidence: "medium" },
      { name: "Fish ball soup", local_name: "魚丸湯", portion: "1 bowl, 3 fish balls", kcal: 110, protein_g: 8, carbs_g: 8, fat_g: 5, confidence: "medium" },
    ],
    verdict: "Nice light meal, but low on protein for your day.",
    suggestions: [
      {
        action: "Add a braised egg (滷蛋)",
        reason: "Cheap, available at the same stall, and adds easy protein.",
        delta: { kcal: 80, protein_g: 7, carbs_g: 1, fat_g: 5 },
      },
      {
        action: "Add a side of braised tofu (滷豆腐)",
        reason: "More protein without much extra fat.",
        delta: { kcal: 90, protein_g: 7, carbs_g: 3, fat_g: 6 },
      },
    ],
  },
  {
    is_food: true,
    meal_name: "Bubble milk tea + chicken cutlet",
    dishes: [
      { name: "Bubble milk tea, regular sugar", local_name: "珍珠奶茶 全糖", portion: "1 large cup (700ml)", kcal: 520, protein_g: 4, carbs_g: 92, fat_g: 15, confidence: "medium" },
      { name: "Fried chicken cutlet", local_name: "雞排", portion: "1 large cutlet (~250g)", kcal: 640, protein_g: 45, carbs_g: 30, fat_g: 38, confidence: "medium" },
    ],
    verdict: "Classic night-market combo, but the drink alone is a meal's worth of sugar.",
    suggestions: [
      {
        action: "Order the tea 微糖 with no pearls next time",
        reason: "Sugar and tapioca are most of the drink's calories.",
        delta: { kcal: -290, protein_g: 0, carbs_g: -70, fat_g: 0 },
      },
      {
        action: "Share the 雞排 or skip the seasoning powder",
        reason: "Half a cutlet still gives good protein with much less fat.",
        delta: { kcal: -320, protein_g: -22, carbs_g: -15, fat_g: -19 },
      },
    ],
  },
];

export function randomDemoResult(): Analysis {
  return DEMO_RESULTS[Math.floor(Math.random() * DEMO_RESULTS.length)];
}
