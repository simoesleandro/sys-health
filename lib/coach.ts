import type { TodayAmazfitData, TodayNutritionTotals } from "@/lib/data"
import { NUTRITION_GOALS } from "@/lib/goals"

export type CoachDayContext = {
  date: string
  nutrition: TodayNutritionTotals
  amazfit: TodayAmazfitData
}

export type CoachHealthContext = {
  today: CoachDayContext
  yesterday: CoachDayContext
}

function formatDayLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  const parsed = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed)
}

function formatDaySnapshot(label: string, day: CoachDayContext) {
  const sonoHoras = (day.amazfit.sonoTotalMin / 60).toFixed(1)
  const hrvLabel =
    day.amazfit.synced && day.amazfit.hrvMs > 0
      ? `${day.amazfit.hrvMs} ms`
      : "sem dado"

  return [
    `${label} (${formatDayLabel(day.date)}):`,
    `Calorias ${Math.round(day.nutrition.calorias)}/${NUTRITION_GOALS.TMB_KCAL},`,
    `Proteína ${Math.round(day.nutrition.proteinas)}/${NUTRITION_GOALS.PROTEIN_G}g,`,
    `Água ${day.nutrition.aguaLitros.toFixed(1)}/${NUTRITION_GOALS.WATER_L}L,`,
    `Sono ${sonoHoras}h, HRV ${hrvLabel}.`,
  ].join(" ")
}

export function buildCoachSystemPrompt(context: CoachHealthContext) {
  return [
    "Você é o SYS.HEALTH Coach, um assistente de saúde rigoroso, mas empático.",
    "Tem acesso aos dados reais do utilizador em horário de Brasília (BRT) para hoje e ontem.",
    formatDaySnapshot("Hoje", context.today),
    formatDaySnapshot("Ontem", context.yesterday),
    "Quando o utilizador perguntar por ontem ou por comparações entre dias, use os dados de ontem acima.",
    "Se perguntar por datas mais antigas, diga que só tem hoje e ontem neste contexto.",
    "Baseie as suas respostas nestes dados reais.",
    "Responda em Markdown claro e conciso.",
  ].join(" ")
}
