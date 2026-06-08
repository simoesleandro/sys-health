"use server"

import { revalidatePath } from "next/cache"

import type { CreateMealInput } from "@/lib/meals"
import { createServerSupabase } from "@/lib/supabase/server"

export async function createMeal(data: CreateMealInput) {
  if (!data.componentes.length) {
    return { success: false as const, error: "Adicione pelo menos um alimento." }
  }

  const supabase = createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  try {
    const { error } = await supabase.from("refeicoes").insert({
      categoria: data.categoria,
      descricao: data.descricao,
      calorias: data.calorias,
      proteinas: data.proteinas,
      carboidratos: data.carboidratos,
      gorduras: data.gorduras,
      componentes_json: JSON.stringify(data.componentes),
      data_hora: new Date().toISOString(),
    })

    if (error) throw error

    revalidatePath("/registros")
    revalidatePath("/", "layout")

    return { success: true as const }
  } catch (error) {
    console.error("[createMeal]", error)
    return {
      success: false as const,
      error: "Não foi possível salvar a refeição.",
    }
  }
}

export async function deleteMeal(id: number) {
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false as const, error: "ID inválido." }
  }

  const supabase = createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  const { error } = await supabase.from("refeicoes").delete().eq("id", id)

  if (error) {
    console.error("[deleteMeal]", error)
    return { success: false as const, error: "Não foi possível apagar a refeição." }
  }

  revalidatePath("/registros")
  revalidatePath("/", "layout")

  return { success: true as const }
}
