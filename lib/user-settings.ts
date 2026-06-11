import { cache } from "react"

import {
  DEFAULT_NUTRITION_GOALS,
  type NutritionGoals,
} from "@/lib/goals"
import {
  buildRegistrationPresets,
  DEFAULT_VISUAL_SUPPLEMENTS,
  type SupplementPreset,
  type SupplementTheme,
  type VisualSupplement,
} from "@/lib/supplements"
import { requireAuth } from "@/lib/supabase/auth"

export type UserSupplementConfig = VisualSupplement & {
  dbId: number
  sortOrder: number
  ativo: boolean
}

export type SupplementConfigInput = {
  presetId: string
  nome: string
  marca: string
  dose: string
  corTema: SupplementTheme
  label: string
  descricao: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  sortOrder: number
  ativo: boolean
}

/** Cadastro simplificado — só produto e marca; o sistema preenche o resto. */
export type SupplementProductInput = {
  nome: string
  marca: string
  ativo: boolean
}

function mapGoalsRow(row: Record<string, unknown>): NutritionGoals {
  return {
    TMB_KCAL: Number(row.tmb_kcal ?? DEFAULT_NUTRITION_GOALS.TMB_KCAL),
    PROTEIN_G: Number(row.protein_g ?? DEFAULT_NUTRITION_GOALS.PROTEIN_G),
    CARBS_G: Number(row.carbs_g ?? DEFAULT_NUTRITION_GOALS.CARBS_G),
    FATS_G: Number(row.fats_g ?? DEFAULT_NUTRITION_GOALS.FATS_G),
    WATER_L: Number(row.water_l ?? DEFAULT_NUTRITION_GOALS.WATER_L),
    PAI: Number(row.pai ?? DEFAULT_NUTRITION_GOALS.PAI),
  }
}

function mapSupplementRow(row: Record<string, unknown>): UserSupplementConfig {
  return {
    dbId: Number(row.id),
    id: String(row.preset_id),
    nome: String(row.nome ?? ""),
    marca: String(row.marca ?? ""),
    dose: String(row.dose ?? ""),
    cor_tema: String(row.cor_tema ?? "cyan") as SupplementTheme,
    label: String(row.label ?? ""),
    descricao: String(row.descricao ?? ""),
    calorias: Number(row.calorias ?? 0),
    proteinas: Number(row.proteinas ?? 0),
    carboidratos: Number(row.carboidratos ?? 0),
    gorduras: Number(row.gorduras ?? 0),
    sortOrder: Number(row.sort_order ?? 0),
    ativo: row.ativo !== false,
  }
}

export function toSupplementPresets(
  supplements: VisualSupplement[]
): SupplementPreset[] {
  return buildRegistrationPresets(supplements)
}

async function seedDefaultGoals(userId: string) {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase) return DEFAULT_NUTRITION_GOALS

  const { error } = await auth.supabase.from("metas_usuario").insert({
    user_id: userId,
    tmb_kcal: DEFAULT_NUTRITION_GOALS.TMB_KCAL,
    protein_g: DEFAULT_NUTRITION_GOALS.PROTEIN_G,
    carbs_g: DEFAULT_NUTRITION_GOALS.CARBS_G,
    fats_g: DEFAULT_NUTRITION_GOALS.FATS_G,
    water_l: DEFAULT_NUTRITION_GOALS.WATER_L,
    pai: DEFAULT_NUTRITION_GOALS.PAI,
  })

  if (error) {
    console.error("[seedDefaultGoals]", error)
    return DEFAULT_NUTRITION_GOALS
  }

  return DEFAULT_NUTRITION_GOALS
}

async function seedDefaultSupplements(userId: string) {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase) return DEFAULT_VISUAL_SUPPLEMENTS

  const rows = DEFAULT_VISUAL_SUPPLEMENTS.map((item, index) => ({
    user_id: userId,
    preset_id: item.id,
    nome: item.nome,
    marca: item.marca,
    dose: item.dose,
    cor_tema: item.cor_tema,
    label: item.label,
    descricao: item.descricao,
    calorias: item.calorias,
    proteinas: item.proteinas,
    carboidratos: item.carboidratos,
    gorduras: item.gorduras,
    sort_order: index,
    ativo: true,
  }))

  const { error } = await auth.supabase.from("suplementos_config").insert(rows)
  if (error) {
    console.error("[seedDefaultSupplements]", error)
    return DEFAULT_VISUAL_SUPPLEMENTS
  }

  return DEFAULT_VISUAL_SUPPLEMENTS
}

export const getUserNutritionGoals = cache(async (): Promise<NutritionGoals> => {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return DEFAULT_NUTRITION_GOALS
  }

  const { data, error } = await auth.supabase
    .from("metas_usuario")
    .select("tmb_kcal, protein_g, carbs_g, fats_g, water_l, pai")
    .eq("user_id", auth.user.id)
    .maybeSingle()

  if (error) {
    console.error("[getUserNutritionGoals]", error)
    return DEFAULT_NUTRITION_GOALS
  }

  if (!data) {
    return seedDefaultGoals(auth.user.id)
  }

  return mapGoalsRow(data)
})

export const getUserSupplementConfigs = cache(
  async (): Promise<UserSupplementConfig[]> => {
    const auth = await requireAuth()
    if (auth.error || !auth.supabase || !auth.user) {
      return DEFAULT_VISUAL_SUPPLEMENTS.map((item, index) => ({
        ...item,
        dbId: index,
        sortOrder: index,
        ativo: true,
      }))
    }

    const { data, error } = await auth.supabase
      .from("suplementos_config")
      .select(
        "id, preset_id, nome, marca, dose, cor_tema, label, descricao, calorias, proteinas, carboidratos, gorduras, sort_order, ativo"
      )
      .eq("user_id", auth.user.id)
      .order("sort_order", { ascending: true })

    if (error) {
      console.error("[getUserSupplementConfigs]", error)
      return DEFAULT_VISUAL_SUPPLEMENTS.map((item, index) => ({
        ...item,
        dbId: index,
        sortOrder: index,
        ativo: true,
      }))
    }

    if (!data?.length) {
      await seedDefaultSupplements(auth.user.id)
      const { data: seededRows, error: refetchError } = await auth.supabase
        .from("suplementos_config")
        .select(
          "id, preset_id, nome, marca, dose, cor_tema, label, descricao, calorias, proteinas, carboidratos, gorduras, sort_order, ativo"
        )
        .eq("user_id", auth.user.id)
        .order("sort_order", { ascending: true })

      if (refetchError || !seededRows?.length) {
        return DEFAULT_VISUAL_SUPPLEMENTS.map((item, index) => ({
          ...item,
          dbId: index,
          sortOrder: index,
          ativo: true,
        }))
      }

      return seededRows.map((row) => mapSupplementRow(row))
    }

    return data.map((row) => mapSupplementRow(row))
  }
)

export const getActiveVisualSupplements = cache(async (): Promise<VisualSupplement[]> => {
  const configs = await getUserSupplementConfigs()
  return configs.filter((item) => item.ativo)
})

export const getUserSupplementPresets = cache(async (): Promise<SupplementPreset[]> => {
  const active = await getActiveVisualSupplements()
  return toSupplementPresets(active)
})

export async function findUserSupplementById(
  id: string
): Promise<SupplementPreset | undefined> {
  const { getTodayMeals } = await import("@/lib/data")
  const [configs, meals] = await Promise.all([
    getUserSupplementConfigs(),
    getTodayMeals(),
  ])

  const { resolvePresetForRegistration } = await import("@/lib/supplements")
  return resolvePresetForRegistration(id, configs, meals)
}
