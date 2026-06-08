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
}

export const FOOD_REFERENCE_UNITS = ["g", "ml", "und"] as const

export type FoodReferenceUnit = (typeof FOOD_REFERENCE_UNITS)[number]

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
