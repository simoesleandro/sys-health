"use server"

import { revalidatePath } from "next/cache"

import {
  FOOD_REFERENCE_UNITS,
  parseFoodComboComponents,
  type FoodFormInput,
} from "@/lib/foods"
import type { FoodSearchResult } from "@/lib/meals"
import { requireAuth } from "@/lib/supabase/auth"
import { createServerSupabase } from "@/lib/supabase/server"

const FOOD_SEARCH_FIELDS =
  "id, descricao, categoria, vezes_usado, calorias, proteinas, carboidratos, gorduras, qtd_referencia, unidade_referencia, origem, componentes_json"

const LEGACY_FOOD_SEARCH_FIELDS =
  "id, descricao, categoria, vezes_usado, calorias, proteinas, carboidratos, gorduras, qtd_referencia, unidade_referencia"

const SEARCH_STOPWORDS = new Set([
  "a",
  "as",
  "com",
  "da",
  "de",
  "do",
  "e",
  "em",
  "o",
  "os",
])

const SEARCH_TOKEN_VARIANTS: Record<string, string[]> = {
  acucar: ["açúcar"],
  cafe: ["café"],
  grao: ["grão"],
  maca: ["maçã"],
  mamao: ["mamão"],
  pao: ["pão"],
  proteina: ["proteína"],
}

type FoodDbPayload = {
  descricao: string
  categoria: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  qtd_referencia: number
  unidade_referencia: string
  origem: string
  componentes_json: string | null
}

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
      origem: data.origem === "ia" ? "ia" : "manual",
      componentes_json:
        data.componentes && data.componentes.length > 0
          ? JSON.stringify(data.componentes)
          : null,
    },
  }
}

function isFoodMetadataSchemaError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const row = error as Record<string, unknown>
  const text = [row.message, row.details, row.hint, row.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  const mentionsMetadata =
    text.includes("origem") || text.includes("componentes_json")
  const looksLikeMissingColumn =
    text.includes("column") ||
    text.includes("schema") ||
    text.includes("could not find") ||
    text.includes("42703") ||
    text.includes("pgrst204")

  return mentionsMetadata && looksLikeMissingColumn
}

function toLegacyFoodPayload(value: FoodDbPayload) {
  return {
    descricao: value.descricao,
    categoria: value.categoria,
    calorias: value.calorias,
    proteinas: value.proteinas,
    carboidratos: value.carboidratos,
    gorduras: value.gorduras,
    qtd_referencia: value.qtd_referencia,
    unidade_referencia: value.unidade_referencia,
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
    vezesUsado: Number(row.vezes_usado ?? 0),
    calorias: Number(row.calorias ?? 0),
    proteinas: Number(row.proteinas ?? 0),
    carboidratos: Number(row.carboidratos ?? 0),
    gorduras: Number(row.gorduras ?? 0),
    qtdReferencia: Number(row.qtd_referencia ?? 100),
    unidadeReferencia: String(row.unidade_referencia ?? "g"),
    origem: row.origem === "ia" ? "ia" : "manual",
    componentes: parseFoodComboComponents(row.componentes_json),
  }
}

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenizeSearchTerm(value: string) {
  return normalizeSearchText(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !SEARCH_STOPWORDS.has(token))
    .slice(0, 5)
}

function getSearchTokenVariants(token: string) {
  return [token, ...(SEARCH_TOKEN_VARIANTS[token] ?? [])]
}

function getFoodSearchScore(
  food: FoodSearchResult,
  term: string,
  tokens: string[]
) {
  const normalizedTerm = normalizeSearchText(term)
  const normalizedDescription = normalizeSearchText(food.descricao)
  const normalizedCategory = normalizeSearchText(food.categoria)

  let score = Math.min(food.vezesUsado, 30) * 2

  if (normalizedDescription === normalizedTerm) score += 120
  if (normalizedDescription.includes(normalizedTerm)) score += 80

  for (const token of tokens) {
    if (normalizedDescription.includes(token)) score += 28
    if (normalizedDescription.startsWith(token)) score += 12
    if (normalizedCategory.includes(token)) score += 8
  }

  return score
}

export async function searchFoods(query: string): Promise<FoodSearchResult[]> {
  const term = query.trim()
  if (term.length < 2) return []
  const tokens = tokenizeSearchTerm(term)

  const supabase = await createServerSupabase()
  if (!supabase) return []
  const db = supabase

  async function runSearch(fields: string) {
    const directResult = await db
      .from("alimentos_favoritos")
      .select(fields)
      .ilike("descricao", `%${term}%`)
      .order("vezes_usado", { ascending: false })
      .limit(15)

    if (directResult.error) throw directResult.error

    const dbSearchTokens = [
      ...new Set(tokens.slice(0, 3).flatMap(getSearchTokenVariants)),
    ].slice(0, 6)

    const tokenResults = await Promise.all(
      dbSearchTokens.map((token) =>
        db
          .from("alimentos_favoritos")
          .select(fields)
          .ilike("descricao", `%${token}%`)
          .order("vezes_usado", { ascending: false })
          .limit(20)
      )
    )

    const byId = new Map<number, FoodSearchResult>()

    for (const row of directResult.data ?? []) {
      const food = mapFoodSearchRow(row as unknown as Record<string, unknown>)
      byId.set(food.id, food)
    }

    for (const result of tokenResults) {
      if (result.error) throw result.error
      for (const row of result.data ?? []) {
        const food = mapFoodSearchRow(row as unknown as Record<string, unknown>)
        byId.set(food.id, food)
      }
    }

    return Array.from(byId.values())
      .filter((food) => {
        if (tokens.length === 0) return true

        const searchable = [
          normalizeSearchText(food.descricao),
          normalizeSearchText(food.categoria),
        ].join(" ")
        return tokens.every((token) => searchable.includes(token))
      })
      .sort((a, b) => {
        const scoreDiff =
          getFoodSearchScore(b, term, tokens) -
          getFoodSearchScore(a, term, tokens)
        if (scoreDiff !== 0) return scoreDiff
        return a.descricao.localeCompare(b.descricao, "pt-BR")
      })
      .slice(0, 15)
  }

  try {
    return await runSearch(FOOD_SEARCH_FIELDS)
  } catch (error) {
    if (isFoodMetadataSchemaError(error)) {
      console.warn(
        "[searchFoods] colunas de IA/combos ainda não existem no banco; usando busca legada."
      )
      return runSearch(LEGACY_FOOD_SEARCH_FIELDS)
    }

    console.error("[searchFoods]", error)
    return []
  }
}

export async function getFrequentFoods(limit = 8): Promise<FoodSearchResult[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 12)
  const supabase = await createServerSupabase()
  if (!supabase) return []
  const db = supabase

  async function runQuery(fields: string) {
    const { data, error } = await db
      .from("alimentos_favoritos")
      .select(fields)
      .order("vezes_usado", { ascending: false })
      .order("descricao", { ascending: true })
      .limit(safeLimit)

    if (error) throw error

    return (data ?? []).map((row) =>
      mapFoodSearchRow(row as unknown as Record<string, unknown>)
    )
  }

  try {
    return await runQuery(FOOD_SEARCH_FIELDS)
  } catch (error) {
    if (isFoodMetadataSchemaError(error)) {
      console.warn(
        "[getFrequentFoods] colunas de IA/combos ainda não existem no banco; usando atalhos legados."
      )
      return runQuery(LEGACY_FOOD_SEARCH_FIELDS)
    }

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
  const db = supabase

  async function runQuery(fields: string) {
    const [frequentResult, comboResult] = await Promise.all([
      db
        .from("alimentos_favoritos")
        .select(fields)
        .order("vezes_usado", { ascending: false })
        .order("descricao", { ascending: true })
        .limit(safeLimit),
      db
        .from("alimentos_favoritos")
        .select(fields)
        .ilike("categoria", "combo")
        .order("descricao", { ascending: true })
        .limit(safeComboLimit),
    ])

    if (frequentResult.error) throw frequentResult.error
    if (comboResult.error) throw comboResult.error

    const byId = new Map<number, FoodSearchResult>()
    for (const row of [...(comboResult.data ?? []), ...(frequentResult.data ?? [])]) {
      const food = mapFoodSearchRow(row as unknown as Record<string, unknown>)
      byId.set(food.id, food)
    }

    return Array.from(byId.values())
  }

  try {
    return await runQuery(FOOD_SEARCH_FIELDS)
  } catch (error) {
    if (isFoodMetadataSchemaError(error)) {
      console.warn(
        "[getFoodShortcuts] colunas de IA/combos ainda não existem no banco; usando atalhos legados."
      )
      return runQuery(LEGACY_FOOD_SEARCH_FIELDS)
    }

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
    let result = await auth.supabase
      .from("alimentos_favoritos")
      .insert({
        ...validation.value,
        user_id: auth.user.id,
        vezes_usado: 0,
      })
      .select(FOOD_SEARCH_FIELDS)
      .single()

    if (result.error && isFoodMetadataSchemaError(result.error)) {
      console.warn(
        "[createFood] colunas de IA/combos ainda não existem no banco; salvando alimento em modo legado."
      )
      result = await auth.supabase
        .from("alimentos_favoritos")
        .insert({
          ...toLegacyFoodPayload(validation.value),
          user_id: auth.user.id,
          vezes_usado: 0,
        })
        .select(LEGACY_FOOD_SEARCH_FIELDS)
        .single()
    }

    if (result.error) throw result.error

    revalidateFoodPaths()
    return {
      success: true as const,
      food: mapFoodSearchRow(result.data as Record<string, unknown>),
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
    let result = await auth.supabase
      .from("alimentos_favoritos")
      .update(validation.value)
      .eq("id", id)
      .eq("user_id", auth.user.id)

    if (result.error && isFoodMetadataSchemaError(result.error)) {
      console.warn(
        "[updateFood] colunas de IA/combos ainda não existem no banco; atualizando alimento em modo legado."
      )
      result = await auth.supabase
        .from("alimentos_favoritos")
        .update(toLegacyFoodPayload(validation.value))
        .eq("id", id)
        .eq("user_id", auth.user.id)
    }

    if (result.error) throw result.error

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
