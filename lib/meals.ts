/** Categorias de refeição — GUIA-DO-PROJETO.md §7 */
export const MEAL_CATEGORIES = [
  "Café da Manhã",
  "Lanche da Manhã",
  "Almoço",
  "Lanche da Tarde",
  "Jantar",
  "Lanche da Noite",
  "Pré-Treino",
  "Pós-Treino",
] as const

export type MealCategory = (typeof MEAL_CATEGORIES)[number]

export type FoodSearchResult = {
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

export type MealComponentPayload = {
  nome: string
  gramas: number
  unidade: string
  kcal: number
  prot: number
  carb: number
  gord: number
  banco_id: number
}

export type CartItem = {
  uid: string
  bancoId: number
  nome: string
  qtd: number
  unidade: string
  qtdRef: number
  kcalRef: number
  protRef: number
  carbRef: number
  gordRef: number
}

export type CreateMealInput = {
  categoria: string
  descricao: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  componentes: MealComponentPayload[]
}

/** Sugere categoria pelo horário de Brasília (espelha _cat_hora do Streamlit). */
export function suggestMealCategoryByHour(date = new Date()): MealCategory {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hour12: false,
    }).format(date)
  )

  if (hour >= 6 && hour <= 9) return "Café da Manhã"
  if (hour >= 10 && hour <= 11) return "Lanche da Manhã"
  if (hour >= 12 && hour <= 14) return "Almoço"
  if (hour >= 15 && hour <= 17) return "Lanche da Tarde"
  if (hour >= 18 && hour <= 20) return "Jantar"
  return "Lanche da Noite"
}

export function foodToCartItem(food: FoodSearchResult, qtd: number): CartItem {
  return {
    uid: `${food.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    bancoId: food.id,
    nome: food.descricao,
    qtd,
    unidade: food.unidadeReferencia,
    qtdRef: food.qtdReferencia,
    kcalRef: food.calorias,
    protRef: food.proteinas,
    carbRef: food.carboidratos,
    gordRef: food.gorduras,
  }
}

export function calcItemMacros(item: CartItem) {
  const fator = item.qtdRef > 0 ? item.qtd / item.qtdRef : 0
  return {
    kcal: round1(item.kcalRef * fator),
    prot: round1(item.protRef * fator),
    carb: round1(item.carbRef * fator),
    gord: round1(item.gordRef * fator),
  }
}

export function cartToComponentes(cart: CartItem[]): MealComponentPayload[] {
  return cart.map((item) => {
    const macros = calcItemMacros(item)
    return {
      nome: item.nome,
      gramas: item.qtd,
      unidade: item.unidade,
      kcal: macros.kcal,
      prot: macros.prot,
      carb: macros.carb,
      gord: macros.gord,
      banco_id: item.bancoId,
    }
  })
}

export function sumCartMacros(cart: CartItem[]) {
  return cart.reduce(
    (acc, item) => {
      const macros = calcItemMacros(item)
      acc.calorias += macros.kcal
      acc.proteinas += macros.prot
      acc.carboidratos += macros.carb
      acc.gorduras += macros.gord
      return acc
    },
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  )
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}
