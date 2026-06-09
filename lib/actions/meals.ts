"use server"

import { revalidatePath } from "next/cache"

import { formatMealTimeBrt, getBrtTodayUtcBounds } from "@/lib/brt-time"
import type { CreateMealInput, UpdateMealInput } from "@/lib/meals"
import { parseStoredComponentes, storedComponentToCartItem } from "@/lib/meals"
import { createServerSupabase } from "@/lib/supabase/server"

function revalidateMealPaths() {
  revalidatePath("/registros")
  revalidatePath("/")
}

export async function createMeal(data: CreateMealInput) {
  if (!data.componentes.length) {
    return { success: false as const, error: "Adicione pelo menos um alimento." }
  }

  const supabase = await createServerSupabase()
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

    revalidateMealPaths()

    return { success: true as const }
  } catch (error) {
    console.error("[createMeal]", error)
    return {
      success: false as const,
      error: "Não foi possível salvar a refeição.",
    }
  }
}

export async function updateMeal(data: UpdateMealInput) {
  if (!Number.isFinite(data.id) || data.id <= 0) {
    return { success: false as const, error: "ID inválido." }
  }

  if (!data.componentes.length) {
    return { success: false as const, error: "Adicione pelo menos um alimento." }
  }

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  try {
    const { error } = await supabase
      .from("refeicoes")
      .update({
        categoria: data.categoria,
        descricao: data.descricao,
        calorias: data.calorias,
        proteinas: data.proteinas,
        carboidratos: data.carboidratos,
        gorduras: data.gorduras,
        componentes_json: JSON.stringify(data.componentes),
      })
      .eq("id", data.id)

    if (error) throw error

    revalidateMealPaths()

    return { success: true as const }
  } catch (error) {
    console.error("[updateMeal]", error)
    return {
      success: false as const,
      error: "Não foi possível atualizar a refeição.",
    }
  }
}

export async function deleteMeal(id: number) {
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false as const, error: "ID inválido." }
  }

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  const { error } = await supabase.from("refeicoes").delete().eq("id", id)

  if (error) {
    console.error("[deleteMeal]", error)
    return { success: false as const, error: "Não foi possível apagar a refeição." }
  }

  revalidateMealPaths()

  return { success: true as const }
}

export type MealPickerItem = {
  id: number
  categoria: string
  hora: string
  descricao: string
}

export async function fetchTodayMealsForPicker(): Promise<MealPickerItem[]> {
  const supabase = await createServerSupabase()
  if (!supabase) return []

  const { startIso, endIso } = getBrtTodayUtcBounds()

  try {
    const { data, error } = await supabase
      .from("refeicoes")
      .select("id, data_hora, categoria, descricao")
      .gte("data_hora", startIso)
      .lt("data_hora", endIso)
      .order("data_hora", { ascending: false })

    if (error) throw error

    return (data ?? []).map((row) => ({
      id: Number(row.id),
      categoria: String(row.categoria ?? "Refeição"),
      hora: formatMealTimeBrt(String(row.data_hora ?? "")),
      descricao: String(row.descricao ?? ""),
    }))
  } catch (error) {
    console.error("[fetchTodayMealsForPicker]", error)
    return []
  }
}

export type MealForEdit = {
  id: number
  categoria: string
  cartJson: string
}

export async function getMealForEdit(
  id: number
): Promise<{ success: true; meal: MealForEdit } | { success: false; error: string }> {
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false, error: "ID inválido." }
  }

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false, error: "Supabase não configurado." }
  }

  try {
    const { data, error } = await supabase
      .from("refeicoes")
      .select("id, categoria, descricao, componentes_json")
      .eq("id", id)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return { success: false, error: "Refeição não encontrada." }
    }

    const componentes = parseStoredComponentes(
      data.componentes_json as string | null,
      String(data.descricao ?? "")
    )
    const cart = componentes.map((item, index) =>
      storedComponentToCartItem(item, index)
    )

    return {
      success: true,
      meal: {
        id: Number(data.id),
        categoria: String(data.categoria ?? "Refeição"),
        cartJson: JSON.stringify(cart),
      },
    }
  } catch (error) {
    console.error("[getMealForEdit]", error)
    return { success: false, error: "Não foi possível carregar a refeição." }
  }
}
