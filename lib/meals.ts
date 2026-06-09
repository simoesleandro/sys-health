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

export type UpdateMealInput = CreateMealInput & {
  id: number
}

export type StoredMealComponent = {
  nome: string
  gramas: number
  unidade: string
  kcal: number
  prot: number
  carb: number
  gord: number
  banco_id: number
}

export function parseStoredComponentes(
  raw: string | null | undefined,
  descricaoFallback = ""
): StoredMealComponent[] {
  if (raw) {
    try {
      const data = JSON.parse(raw) as unknown
      if (Array.isArray(data)) {
        const items: StoredMealComponent[] = []

        for (const item of data) {
          if (!item || typeof item !== "object") continue
          const row = item as Record<string, unknown>
          const nome = String(row.nome ?? descricaoFallback ?? "").trim()
          if (!nome) continue

          const gramas = Number(row.gramas ?? row.qtd ?? 0)
          items.push({
            nome,
            gramas: Number.isFinite(gramas) && gramas > 0 ? gramas : 1,
            unidade: String(row.unidade ?? "g"),
            kcal: Number(row.kcal ?? 0),
            prot: Number(row.prot ?? 0),
            carb: Number(row.carb ?? 0),
            gord: Number(row.gord ?? 0),
            banco_id: Number(row.banco_id ?? 0),
          })
        }

        if (items.length > 0) return items
      }
    } catch {
      // fallback abaixo
    }
  }

  if (descricaoFallback.trim()) {
    return [
      {
        nome: descricaoFallback.trim(),
        gramas: 1,
        unidade: "g",
        kcal: 0,
        prot: 0,
        carb: 0,
        gord: 0,
        banco_id: 0,
      },
    ]
  }

  return []
}

export function storedComponentToCartItem(
  comp: StoredMealComponent,
  index: number
): CartItem {
  const qtd = comp.gramas > 0 ? comp.gramas : 1

  return {
    uid: `edit-${comp.banco_id}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    bancoId: comp.banco_id,
    nome: comp.nome,
    qtd,
    unidade: comp.unidade,
    qtdRef: qtd,
    kcalRef: comp.kcal,
    protRef: comp.prot,
    carbRef: comp.carb,
    gordRef: comp.gord,
  }
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

export function aiItemToCartItem(item: {
  nome: string
  qtd: number
  unidade: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}): CartItem {
  const qtd = item.qtd > 0 ? item.qtd : 1

  return {
    uid: `ia-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    bancoId: 0,
    nome: item.nome,
    qtd,
    unidade: item.unidade,
    qtdRef: qtd,
    kcalRef: item.calorias,
    protRef: item.proteinas,
    carbRef: item.carboidratos,
    gordRef: item.gorduras,
  }
}

export function supplementToCartItem(preset: {
  id: string
  label: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}): CartItem {
  return {
    uid: `supp-${preset.id}`,
    bancoId: 0,
    nome: preset.label,
    qtd: 1,
    unidade: "dose",
    qtdRef: 1,
    kcalRef: preset.calorias,
    protRef: preset.proteinas,
    carbRef: preset.carboidratos,
    gordRef: preset.gorduras,
  }
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
