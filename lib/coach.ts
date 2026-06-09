import { formatSleepMinutes, type TodayAmazfitData, type TodayNutritionTotals } from "@/lib/data"
import type { NutritionGoals } from "@/lib/goals"
import type { HevyWorkout, ZeppRunSession } from "@/lib/treinos"

export type CoachEvacuationSummary = {
  count: number
  summary: string
}

export type CoachActivitySummary = {
  hevy: string | null
  zepp: string | null
}

export type CoachDayContext = {
  date: string
  nutrition: TodayNutritionTotals
  amazfit: TodayAmazfitData
  balanceLabel: string
  evacuations: CoachEvacuationSummary
  activities: CoachActivitySummary
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

function brtDateFromIso(iso: string) {
  const parsed = Date.parse(iso)
  if (!Number.isFinite(parsed)) return null

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(parsed))
}

export function summarizeEvacuations(
  records: { tipoLabel: string; horaLabel: string }[]
): CoachEvacuationSummary {
  if (!records.length) {
    return { count: 0, summary: "nenhum registo" }
  }

  return {
    count: records.length,
    summary: records
      .map((record) => `${record.tipoLabel} às ${record.horaLabel}`)
      .join("; "),
  }
}

export function summarizeActivitiesForDate(
  date: string,
  hevyWorkouts: HevyWorkout[],
  zeppSessions: ZeppRunSession[]
): CoachActivitySummary {
  const hevy = hevyWorkouts.find(
    (workout) => brtDateFromIso(workout.dataHora) === date
  )
  const zepp = zeppSessions.find((session) => session.data === date)

  return {
    hevy: hevy
      ? `${hevy.titulo} — ${hevy.duracaoMin ?? "?"} min${
          hevy.volumeKg != null ? `, ${Math.round(hevy.volumeKg)} kg volume` : ""
        }`
      : null,
    zepp: zepp
      ? `${zepp.tipo} ${zepp.distanciaKm} km, ${zepp.duracaoMinutos ?? "?"} min, pace ${zepp.pace}`
      : null,
  }
}

function formatWearableSnapshot(day: CoachDayContext, goals: NutritionGoals) {
  if (!day.amazfit.synced) {
    return "Wearable: sem sync hoje."
  }

  const parts = [
    `Passos ${day.amazfit.passos.toLocaleString("pt-BR")}`,
    `Calorias ativas ${day.amazfit.caloriasGastas}`,
    `Sono ${formatSleepMinutes(day.amazfit.sonoTotalMin)}`,
  ]

  if (day.amazfit.hrvMs > 0) {
    parts.push(`HRV ${day.amazfit.hrvMs} ms`)
  }

  if (day.amazfit.pai > 0) {
    parts.push(`PAI ${day.amazfit.pai}/${goals.PAI}`)
  }

  return `Wearable: ${parts.join(", ")}.`
}

function formatDaySnapshot(
  label: string,
  day: CoachDayContext,
  goals: NutritionGoals
) {
  const activityParts = [day.activities.hevy, day.activities.zepp].filter(
    Boolean
  )

  return [
    `${label} (${formatDayLabel(day.date)}):`,
    `Nutrição — Calorias ${Math.round(day.nutrition.calorias)}/${goals.TMB_KCAL},`,
    `Proteína ${Math.round(day.nutrition.proteinas)}/${goals.PROTEIN_G}g,`,
    `Carbo ${Math.round(day.nutrition.carboidratos)}/${goals.CARBS_G}g,`,
    `Gordura ${Math.round(day.nutrition.gorduras)}/${goals.FATS_G}g,`,
    `Água ${day.nutrition.aguaLitros.toFixed(1)}/${goals.WATER_L}L.`,
    `Balanço calórico: ${day.balanceLabel}.`,
    formatWearableSnapshot(day, goals),
    `Evacuação: ${day.evacuations.count} registo(s) — ${day.evacuations.summary}.`,
    activityParts.length
      ? `Treinos: ${activityParts.join(" | ")}.`
      : "Treinos: nenhum registo neste dia.",
  ].join(" ")
}

export function buildCoachSystemPrompt(
  context: CoachHealthContext,
  goals: NutritionGoals
) {
  return [
    "Você é o SYS.HEALTH Coach, um assistente de saúde rigoroso, mas empático.",
    "Tem acesso aos dados reais do utilizador em horário de Brasília (BRT) para hoje e ontem.",
    "Inclui nutrição, wearable (passos, sono, HRV, PAI), balanço calórico, evacuação Bristol e treinos Hevy/Zepp.",
    formatDaySnapshot("Hoje", context.today, goals),
    formatDaySnapshot("Ontem", context.yesterday, goals),
    "Quando o utilizador perguntar por ontem ou comparações, use os dados de ontem acima.",
    "Para datas mais antigas, diga que só tem hoje e ontem neste contexto.",
    "Baseie as respostas nestes dados reais. Não invente valores.",
    "Responda em Markdown claro e conciso.",
  ].join(" ")
}
