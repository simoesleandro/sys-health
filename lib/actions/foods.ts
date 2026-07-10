"use server"

import { revalidatePath } from "next/cache"

import {
  FOOD_REFERENCE_UNITS,
  type FoodFormInput,
} from "@/lib/foods"
import type { FoodSearchResult } from "@/lib/meals"
import { requireAuth } from "@/lib/supabase/auth"
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

function mapFoodSearchRow(row: Record<string, unknown>): FoodSearchResult {
  return {
    id: Number(row.id),
    descricao: String(row.descricao ?? ""),
    categoria: String(row.categoria ?? "Lanche"),
    calorias: Number(row.calorias ?? 0),
    proteinas: Number(row.proteinas ?? 0),
    carboidratos: Number(row.carboidratos ?? 0),
    gorduras: Number(row.gorduras ?? 0),
    qtdReferencia: Number(row.qtd_referencia ?? 100),
    unidadeReferencia: String(row.unidade_referencia ?? "g"),
  }
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

    return (data ?? []).map((row) => mapFoodSearchRow(row))
  } catch (error) {
    console.error("[searchFoods]", error)
    return []
  }
}

export async function getFrequentFoods(limit = 8): Promise<FoodSearchResult[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 12)
  const supabase = await createServerSupabase()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from("alimentos_favoritos")
      .select(
        "id, descricao, categoria, calorias, proteinas, carboidratos, gorduras, qtd_referencia, unidade_referencia"
      )
      .order("vezes_usado", { ascending: false })
      .order("descricao", { ascending: true })
      .limit(safeLimit)

    if (error) throw error

    return (data ?? []).map((row) => mapFoodSearchRow(row))
  } catch (error) {
    console.error("[getFrequentFoods]", error)
    return []
  }
}

export async function getFoodShortcuts(
  limit = 8,
  comboLimit = 8
): Promise<FoodSearchResult[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 12)
  const safeComboLimit = Math.min(Math.max(1, Math.floor(comboLimit)), 12)
  const supabase = await createServerSupabase()
  if (!supabase) return []

  try {
    const selectFields =
      "id, descricao, categoria, calorias, proteinas, carboidratos, gorduras, qtd_referencia, unidade_referencia"
    const [frequentResult, comboResult] = await Promise.all([
      supabase
        .from("alimentos_favoritos")
        .select(selectFields)
        .order("vezes_usado", { ascending: false })
        .order("descricao", { ascending: true })
        .limit(safeLimit),
      supabase
        .from("alimentos_favoritos")
        .select(selectFields)
        .ilike("categoria", "combo")
        .order("descricao", { ascending: true })
        .limit(safeComboLimit),
    ])

    if (frequentResult.error) throw frequentResult.error
    if (comboResult.error) throw comboResult.error

    const byId = new Map<number, FoodSearchResult>()
    for (const row of [...(comboResult.data ?? []), ...(frequentResult.data ?? [])]) {
      const food = mapFoodSearchRow(row)
      byId.set(food.id, food)
    }

    return Array.from(byId.values())
  } catch (error) {
    console.error("[getFoodShortcuts]", error)
    return []
  }
}

export async function createFood(data: FoodFormInput) {
  const validation = validateFoodInput(data)
  if (!validation.ok) {
    return { success: false as const, error: validation.error }
  }

  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return {
      success: false as const,
      error: auth.error ?? "Sessão inválida. Faça login novamente.",
    }
  }

  try {
    const { data, error } = await auth.supabase
      .from("alimentos_favoritos")
      .insert({
        ...validation.value,
        user_id: auth.user.id,
        vezes_usado: 0,
      })
      .select(
        "id, descricao, categoria, calorias, proteinas, carboidratos, gorduras, qtd_referencia, unidade_referencia"
      )
      .single()

    if (error) throw error

    revalidateFoodPaths()
    return {
      success: true as const,
      food: mapFoodSearchRow(data as Record<string, unknown>),
    }
  } catch (error) {
    console.error("[createFood]", error)
    return {
      success: false as const,
      error:
        error instanceof Error
          ? `Não foi possível criar o alimento: ${error.message}`
          : "Não foi possível criar o alimento.",
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

  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return {
      success: false as const,
      error: auth.error ?? "Sessão inválida. Faça login novamente.",
    }
  }

  try {
    const { error } = await auth.supabase
      .from("alimentos_favoritos")
      .update(validation.value)
      .eq("id", id)
      .eq("user_id", auth.user.id)

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

  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return {
      success: false as const,
      error: auth.error ?? "Sessão inválida. Faça login novamente.",
    }
  }

  const { error } = await auth.supabase
    .from("alimentos_favoritos")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id)

  if (error) {
    console.error("[deleteFood]", error)
    return { success: false as const, error: "Não foi possível apagar o alimento." }
  }

  revalidateFoodPaths()
  return { success: true as const }
}

export async function incrementFoodsUsage(foodIds: number[]) {
  const ids = [...new Set(foodIds)]
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0)

  if (ids.length === 0) return { success: true as const }

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  try {
    const { data, error } = await supabase
      .from("alimentos_favoritos")
      .select("id, vezes_usado")
      .in("id", ids)

    if (error) throw error

    await Promise.all(
      (data ?? []).map((row) =>
        supabase
          .from("alimentos_favoritos")
          .update({ vezes_usado: Number(row.vezes_usado ?? 0) + 1 })
          .eq("id", Number(row.id))
      )
    )

    revalidateFoodPaths()
    return { success: true as const }
  } catch (error) {
    console.error("[incrementFoodsUsage]", error)
    return { success: false as const, error: "Não foi possível atualizar uso." }
  }
}
