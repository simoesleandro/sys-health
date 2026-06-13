import type { MealAnalysisItem } from "@/lib/meal-analysis"

export type IaAnalysisKind = "coach" | "meal-text" | "meal-photo"

export type IaHistoryEntry = {
  id: string
  kind: IaAnalysisKind
  createdAt: string
  createdLabel: string
  brtDate: string
  entrada: string | null
  resposta: string
  mealItems: MealAnalysisItem[]
}

export function formatIaAnalysisKindLabel(kind: IaAnalysisKind) {
  switch (kind) {
    case "coach":
      return "IA Coach"
    case "meal-text":
      return "Refeição (texto)"
    case "meal-photo":
      return "Refeição (foto)"
  }
}

export function formatMealItemsSummary(items: MealAnalysisItem[]) {
  if (!items.length) return "Nenhum alimento identificado."

  return items
    .map(
      (item) =>
        `${item.nome} (${item.qtd} ${item.unidade}) · ${Math.round(item.calorias)} kcal`
    )
    .join(" · ")
}

export function formatIaCreatedLabel(iso: string) {
  const parsed = Date.parse(iso)
  if (!Number.isFinite(parsed)) return iso

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(parsed))
}

export function brtDateFromIso(iso: string) {
  const parsed = Date.parse(iso)
  if (!Number.isFinite(parsed)) return iso.slice(0, 10)

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(parsed))
}
