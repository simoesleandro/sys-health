import {
  formatSleepMinutes,
  type TodayAmazfitData,
  type TodayNutritionTotals,
} from "@/lib/data"
import type { NutritionGoals } from "@/lib/goals"
import type { LatestMeasurementSummary } from "@/lib/biometry"
import {
  formatExerciseRpeSummary,
  type HevyWorkout,
  type ZeppRunSession,
} from "@/lib/treinos"

export const COACH_WEEK_DAYS = 7

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
  week: CoachDayContext[]
  hevyWorkouts: HevyWorkout[]
  zeppSessions: ZeppRunSession[]
  latestMeasurement: LatestMeasurementSummary
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
    return "Wearable: sem sync."
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

function formatHevyWorkoutDetail(workout: HevyWorkout) {
  const date = brtDateFromIso(workout.dataHora) ?? workout.dataLabel
  const header = `${date}: ${workout.titulo} — ${workout.duracaoMin ?? "?"} min, ${workout.volumeKg != null ? `${Math.round(workout.volumeKg)} kg volume` : "volume —"}`

  if (!workout.exercicios.length) {
    return header
  }

  const exercises = workout.exercicios
    .map((exercise) => {
      const rpe = formatExerciseRpeSummary(exercise)
      const sets = exercise.sets.length
      return `${exercise.title} (${sets} série${sets === 1 ? "" : "s"}, RPE ${rpe})`
    })
    .join("; ")

  return `${header} | ${exercises}`
}

function formatZeppSessionDetail(session: ZeppRunSession) {
  return `${session.data}: ${session.tipo} ${session.distanciaKm.toFixed(2)} km, ${session.duracaoMinutos ?? "?"} min, pace ${session.pace}${session.fcMedia ? `, FC ${Math.round(session.fcMedia)}` : ""}`
}

function formatWeekOverview(week: CoachDayContext[]) {
  if (!week.length) return "Sem dados da semana."

  return week
    .map((day) => {
      const hevyCount = [day.activities.hevy].filter(Boolean).length
      const zeppCount = [day.activities.zepp].filter(Boolean).length
      const wearable = day.amazfit.synced
        ? `passos ${day.amazfit.passos}, sono ${formatSleepMinutes(day.amazfit.sonoTotalMin)}`
        : "wearable sem sync"

      return (
        `${formatDayLabel(day.date)}: cal ${Math.round(day.nutrition.calorias)}, ` +
        `prot ${Math.round(day.nutrition.proteinas)}g, ${wearable}, ` +
        `treinos ${hevyCount + zeppCount} (Hevy ${hevyCount}, Zepp ${zeppCount})`
      )
    })
    .join(" | ")
}

function formatMeasurementSummary(measurement: LatestMeasurementSummary) {
  if (measurement.peso == null || !measurement.dataLabel) {
    return "Última medição corporal: sem registo."
  }

  return `Última medição corporal: ${measurement.peso} kg em ${measurement.dataLabel}.`
}

export function buildCoachSystemPrompt(
  context: CoachHealthContext,
  goals: NutritionGoals
) {
  const hevyLines =
    context.hevyWorkouts.length > 0
      ? context.hevyWorkouts.map(formatHevyWorkoutDetail).join(" || ")
      : "Nenhum treino Hevy (musculação) nos últimos 7 dias."

  const zeppLines =
    context.zeppSessions.length > 0
      ? context.zeppSessions.map(formatZeppSessionDetail).join(" || ")
      : "Nenhuma corrida/caminhada Zepp nos últimos 7 dias."

  return [
    "Você é o SYS.HEALTH Coach, um assistente de saúde rigoroso, mas empático.",
    `Tem acesso aos dados reais do utilizador (BRT) dos últimos ${COACH_WEEK_DAYS} dias.`,
    "Inclui nutrição, wearable (passos, sono, HRV, PAI), balanço calórico, evacuação Bristol, treinos Hevy (musculação com exercícios e RPE) e corridas Zepp.",
    formatMeasurementSummary(context.latestMeasurement),
    `Resumo semanal (${COACH_WEEK_DAYS} dias): ${formatWeekOverview(context.week)}.`,
    formatDaySnapshot("Hoje", context.today, goals),
    formatDaySnapshot("Ontem", context.yesterday, goals),
    `Treinos Hevy detalhados (últimos ${COACH_WEEK_DAYS} dias): ${hevyLines}.`,
    `Cardio Zepp detalhado (últimos ${COACH_WEEK_DAYS} dias): ${zeppLines}.`,
    "Quando o utilizador perguntar pela semana, compare volume de musculação, frequência cardio, sono, HRV, PAI e nutrição usando os dados acima.",
    "Não diga que não tem acesso aos dados — use o contexto fornecido. Se um dia não tiver registo, diga explicitamente.",
    "Baseie as respostas nestes dados reais. Não invente valores.",
    "Se o modelo expuser raciocínio interno (thinking), descreva em português do Brasil as áreas que está a cruzar: nutrição, sono, HRV, PAI, treinos Hevy (volume, RPE), cardio Zepp (pace, FC), biometria e evacuação.",
    "Responda em Markdown claro e conciso.",
  ].join(" ")
}
