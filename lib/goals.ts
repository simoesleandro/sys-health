/** Metas nutricionais — valores padrão (seed / fallback). */
export type NutritionGoals = {
  TMB_KCAL: number
  PROTEIN_G: number
  CARBS_G: number
  FATS_G: number
  WATER_L: number
  PAI: number
}

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  TMB_KCAL: 1863,
  PROTEIN_G: 190,
  CARBS_G: 180,
  FATS_G: 65,
  WATER_L: 3.5,
  PAI: 100,
}

/** @deprecated Use getUserNutritionGoals() — mantido para compatibilidade de tipos. */
export const NUTRITION_GOALS = DEFAULT_NUTRITION_GOALS
