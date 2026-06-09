/** Tipos e formatação de refeições — seguro para Client Components. */

export type MealComponent = {
  nome: string
  gramas?: number
  qtd?: number
  unidade?: string
}

export type TodayMeal = {
  id: number
  dataHora: string
  categoria: string
  descricao: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  componentes: MealComponent[]
}

export function parseComponentesJson(
  raw: string | null | undefined,
  descricaoFallback = ""
): MealComponent[] {
  if (raw) {
    try {
      const data = JSON.parse(raw) as unknown
      if (Array.isArray(data)) {
        const items: MealComponent[] = []
        for (const item of data) {
          if (!item || typeof item !== "object") continue
          const row = item as Record<string, unknown>
          const nome = String(row.nome ?? descricaoFallback ?? "").trim()
          if (!nome) continue
          items.push({
            nome,
            ...(row.gramas != null ? { gramas: Number(row.gramas) } : {}),
            ...(row.qtd != null ? { qtd: Number(row.qtd) } : {}),
            ...(row.unidade != null ? { unidade: String(row.unidade) } : {}),
          })
        }

        if (items.length > 0) return items
      }
    } catch {
      // fallback abaixo
    }
  }

  if (descricaoFallback.trim()) {
    return [{ nome: descricaoFallback.trim() }]
  }

  return []
}

export function formatComponentQuantity(component: MealComponent) {
  const qtd = component.gramas ?? component.qtd
  if (qtd == null || qtd <= 0) return null

  const unidade = component.unidade ?? "g"
  if (unidade === "g" || unidade === "ml") {
    return `${qtd}${unidade}`
  }
  return `${qtd} ${unidade}`
}
