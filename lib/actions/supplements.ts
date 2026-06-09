"use server"

import { revalidatePath } from "next/cache"

import { deleteMeal } from "@/lib/actions/meals"
import { suggestMealCategoryByHour } from "@/lib/meals"
import { findSupplementById, type SupplementPreset } from "@/lib/supplements"
import { createServerSupabase } from "@/lib/supabase/server"

export async function registerSupplements(presetIds: string[]) {
  if (!presetIds.length) {
    return {
      success: false as const,
      error: "Selecione pelo menos um suplemento.",
    }
  }

  const presets = presetIds
    .map((id) => findSupplementById(id))
    .filter((item): item is SupplementPreset => item !== undefined)

  if (!presets.length) {
    return { success: false as const, error: "Suplementos inválidos." }
  }

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  const categoria = suggestMealCategoryByHour()
  const dataHora = new Date().toISOString()

  try {
    const rows = presets.map((preset) => ({
      categoria,
      descricao: preset.descricao,
      calorias: preset.calorias,
      proteinas: preset.proteinas,
      carboidratos: preset.carboidratos,
      gorduras: preset.gorduras,
      componentes_json: JSON.stringify([
        {
          nome: preset.label,
          gramas: 0,
          kcal: preset.calorias,
          prot: preset.proteinas,
          carb: preset.carboidratos,
          gord: preset.gorduras,
          fonte: "Suplemento",
        },
      ]),
      data_hora: dataHora,
    }))

    const { data, error } = await supabase
      .from("refeicoes")
      .insert(rows)
      .select("id")
    if (error) throw error

    revalidatePath("/", "layout")
    revalidatePath("/registros")

    const mealIds = (data ?? []).map((row) => Number(row.id))
    return {
      success: true as const,
      count: presets.length,
      mealIds,
    }
  } catch (error) {
    console.error("[registerSupplements]", error)
    return {
      success: false as const,
      error: "Não foi possível registrar os suplementos.",
    }
  }
}

export async function toggleSupplement(
  presetId: string,
  take: boolean,
  mealId?: number | null
) {
  if (take) {
    const result = await registerSupplements([presetId])
    if (!result.success) return result
    return {
      success: true as const,
      mealId: result.mealIds[0] ?? null,
    }
  }

  if (mealId == null) {
    return {
      success: false as const,
      error: "Registo do suplemento não encontrado para hoje.",
    }
  }

  const result = await deleteMeal(mealId)
  if (!result.success) return result
  return { success: true as const, mealId: null }
}
