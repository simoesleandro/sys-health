export type FavoriteFood = {
  id: number
  descricao: string
  categoria: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  qtdReferencia: number
  unidadeReferencia: string
  origem: FoodOrigin
  componentes: FoodComboComponent[]
}

export type FoodFormInput = {
  descricao: string
  categoria: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  qtdReferencia: number
  unidadeReferencia: string
  origem?: FoodOrigin
  componentes?: FoodComboComponent[]
}

export const FOOD_REFERENCE_UNITS = ["g", "ml", "und"] as const

export type FoodReferenceUnit = (typeof FOOD_REFERENCE_UNITS)[number]

export type FoodOrigin = "manual" | "ia"

export type FoodComboComponent = {
  nome: string
  gramas: number
  unidade: string
  kcal: number
  prot: number
  carb: number
  gord: number
  banco_id: number
}

export function parseFoodComboComponents(
  raw: unknown
): FoodComboComponent[] {
  if (!raw) return []

  try {
    const data = typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw
    if (!Array.isArray(data)) return []

    return data
      .map((item) => {
        if (!item || typeof item !== "object") return null
        const row = item as Record<string, unknown>
        const nome = String(row.nome ?? "").trim()
        if (!nome) return null
        const gramas = Number(row.gramas ?? row.qtd ?? 0)

        return {
          nome,
          gramas: Number.isFinite(gramas) && gramas > 0 ? gramas : 1,
          unidade: String(row.unidade ?? "g"),
          kcal: Number(row.kcal ?? 0),
          prot: Number(row.prot ?? 0),
          carb: Number(row.carb ?? 0),
          gord: Number(row.gord ?? 0),
          banco_id: Number(row.banco_id ?? 0),
        }
      })
      .filter((item): item is FoodComboComponent => item !== null)
  } catch {
    return []
  }
}

export function formatFoodPortion(
  qtdReferencia: number,
  unidadeReferencia: string
) {
  const qtd =
    Number.isInteger(qtdReferencia) || qtdReferencia % 1 === 0
      ? String(Math.round(qtdReferencia))
      : String(qtdReferencia)
  return `${qtd}${unidadeReferencia}`
}

export function formatMacro(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
