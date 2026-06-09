"use server"

import { revalidatePath } from "next/cache"

import {
  FOOD_REFERENCE_UNITS,
  type FoodFormInput,
} from "@/lib/foods"
import type { FoodSearchResult } from "@/lib/meals"
import { createServerSupabase } from "@/lib/supabase/server"

function validateFoodInput(data: FoodFormInput) {
  const descricao = data.descricao.trim()

  if (descricao.length < 2) {
    return { ok: false as const, error: "Informe um nome com pelo menos 2 caracteres." }
  }

  if (data.qtdReferencia <= 0) {
    return { ok: false as const, error: "A porção de referência deve ser maior que zero." }
  }

  if (!FOOD_REFERENCE_UNITS.includes(data.unidadeReferencia as (typeof FOOD_REFERENCE_UNITS)[number])) {
    return { ok: false as const, error: "Unidade de referência inválida." }
  }

  const macros = [
    data.calorias,
    data.proteinas,
    data.carboidratos,
    data.gorduras,
  ]

  if (macros.some((value) => !Number.isFinite(value) || value < 0)) {
    return { ok: false as const, error: "Os valores nutricionais devem ser números válidos." }
  }

  return {
    ok: true as const,
    value: {
      descricao,
      categoria: data.categoria.trim() || "Lanche",
      calorias: data.calorias,
      proteinas: data.proteinas,
      carboidratos: data.carboidratos,
      gorduras: data.gorduras,
      qtd_referencia: data.qtdReferencia,
      unidade_referencia: data.unidadeReferencia,
    },
  }
}

function revalidateFoodPaths() {
  revalidatePath("/banco-alimentos")
  revalidatePath("/", "layout")
}

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const term = query.trim()
  if (term.length < 2) return []

  const supabase = await createServerSupabase()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from("alimentos_favoritos")
      .select(
        "id, descricao, categoria, calorias, proteinas, carboidratos, gorduras, qtd_referencia, unidade_referencia"
      )
      .ilike("descricao", `%${term}%`)
      .order("vezes_usado", { ascending: false })
      .limit(15)

    if (error) throw error

    return (data ?? []).map((row) => ({
      id: Number(row.id),
      descricao: String(row.descricao ?? ""),
      categoria: String(row.categoria ?? "Lanche"),
      calorias: Number(row.calorias ?? 0),
      proteinas: Number(row.proteinas ?? 0),
      carboidratos: Number(row.carboidratos ?? 0),
      gorduras: Number(row.gorduras ?? 0),
      qtdReferencia: Number(row.qtd_referencia ?? 100),
      unidadeReferencia: String(row.unidade_referencia ?? "g"),
    }))
  } catch (error) {
    console.error("[searchFoods]", error)
    return []
  }
}

export async function createFood(data: FoodFormInput) {
  const validation = validateFoodInput(data)
  if (!validation.ok) {
    return { success: false as const, error: validation.error }
  }

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  try {
    const { error } = await supabase.from("alimentos_favoritos").insert({
      ...validation.value,
      vezes_usado: 0,
    })

    if (error) throw error

    revalidateFoodPaths()
    return { success: true as const }
  } catch (error) {
    console.error("[createFood]", error)
    return {
      success: false as const,
      error: "Não foi possível criar o alimento.",
    }
  }
}

export async function updateFood(id: number, data: FoodFormInput) {
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false as const, error: "ID inválido." }
  }

  const validation = validateFoodInput(data)
  if (!validation.ok) {
    return { success: false as const, error: validation.error }
  }

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  try {
    const { error } = await supabase
      .from("alimentos_favoritos")
      .update(validation.value)
      .eq("id", id)

    if (error) throw error

    revalidateFoodPaths()
    return { success: true as const }
  } catch (error) {
    console.error("[updateFood]", error)
    return {
      success: false as const,
      error: "Não foi possível atualizar o alimento.",
    }
  }
}

export async function deleteFood(id: number) {
  if (!Number.isFinite(id) || id <= 0) {
    return { success: false as const, error: "ID inválido." }
  }

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  const { error } = await supabase
    .from("alimentos_favoritos")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("[deleteFood]", error)
    return { success: false as const, error: "Não foi possível apagar o alimento." }
  }

  revalidateFoodPaths()
  return { success: true as const }
}
