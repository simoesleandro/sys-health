import { brtDateFromDataHora } from "@/lib/brt-time"
import {
  getAmazfitDataForDate,
  getNutritionTotalsForDate,
  getRecentHevyWorkouts,
  getWeightHistory,
  getZeppRunningSessions,
} from "@/lib/data"
import type { NutritionGoals } from "@/lib/goals"
import { getLastNBrtDays } from "@/lib/trends"
import { getUserNutritionGoals } from "@/lib/user-settings"

/** Períodos oferecidos no botão "Exportar PDF". */
export const REPORT_PERIOD_OPTIONS = [7, 14, 30] as const
export type ReportPeriodDays = (typeof REPORT_PERIOD_OPTIONS)[number]
export const DEFAULT_REPORT_PERIOD: ReportPeriodDays = 14

export function resolveReportPeriod(
  value: number | string | null | undefined
): ReportPeriodDays {
  const parsed = typeof value === "string" ? Number(value) : value
  return (REPORT_PERIOD_OPTIONS as readonly number[]).includes(parsed as number)
    ? (parsed as ReportPeriodDays)
    : DEFAULT_REPORT_PERIOD
}

export type HealthReport = {
  periodDays: number
  startLabel: string
  endLabel: string
  endDate: string
  generatedAtLabel: string
  goals: NutritionGoals
  nutrition: {
    daysWithData: number
    avgCalorias: number
    avgProteinas: number
    avgCarboidratos: number
    avgGorduras: number
    avgAguaLitros: number
  }
  sleep: { daysWithData: number; avgSleepMin: number }
  steps: { daysWithData: number; avgSteps: number; totalSteps: number }
  recovery: { avgHrvMs: number; avgPai: number }
  weight: {
    start: number | null
    end: number | null
    deltaKg: number | null
    samples: number
  }
  workouts: {
    hevyCount: number
    hevyVolumeKg: number
    zeppCount: number
    zeppDistanceKm: number
  }
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function formatBrtDateLabel(brtDate: string) {
  const [year, month, day] = brtDate.split("-")
  if (!year || !month || !day) return brtDate
  return `${day}/${month}/${year}`
}

function formatGeneratedAtLabel(now = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now)
}

/**
 * Agrega métricas do período (dias BRT) reutilizando o data layer existente:
 * nutrição e wearable por dia, peso, treinos Hevy e cardio Zepp.
 */
export async function getHealthReport(
  periodDays: number
): Promise<HealthReport> {
  const days = getLastNBrtDays(periodDays)
  const startDate = days[0]?.date ?? ""
  const endDate = days[days.length - 1]?.date ?? ""

  const [goals, weightHistory, hevy, zepp, perDay] = await Promise.all([
    getUserNutritionGoals(),
    getWeightHistory(),
    getRecentHevyWorkouts(200),
    getZeppRunningSessions(200),
    Promise.all(
      days.map(async (day) => {
        const [nutrition, amazfit] = await Promise.all([
          getNutritionTotalsForDate(day.date),
          getAmazfitDataForDate(day.date),
        ])
        return { nutrition, amazfit }
      })
    ),
  ])

  const nutritionDays = perDay.filter((d) => d.nutrition.calorias > 0)
  const syncedDays = perDay.filter((d) => d.amazfit.synced)
  const sleepDays = syncedDays.filter((d) => d.amazfit.sonoTotalMin > 0)
  const stepsDays = syncedDays.filter((d) => d.amazfit.passos > 0)
  const hrvDays = syncedDays.filter((d) => d.amazfit.hrvMs > 0)
  const paiDays = syncedDays.filter((d) => d.amazfit.pai > 0)

  const weightPoints = weightHistory.points.filter(
    (point) => point.date >= startDate && point.date <= endDate
  )
  const weightStart = weightPoints[0]?.peso ?? null
  const weightEnd = weightPoints[weightPoints.length - 1]?.peso ?? null

  const inWindow = (brtDate: string) =>
    Boolean(brtDate) && brtDate >= startDate && brtDate <= endDate
  const hevyInWindow = hevy.filter((w) =>
    inWindow(brtDateFromDataHora(w.dataHora))
  )
  const zeppInWindow = zepp.filter((s) => inWindow(s.data))

  return {
    periodDays,
    startLabel: formatBrtDateLabel(startDate),
    endLabel: formatBrtDateLabel(endDate),
    endDate,
    generatedAtLabel: formatGeneratedAtLabel(),
    goals,
    nutrition: {
      daysWithData: nutritionDays.length,
      avgCalorias: average(nutritionDays.map((d) => d.nutrition.calorias)),
      avgProteinas: average(nutritionDays.map((d) => d.nutrition.proteinas)),
      avgCarboidratos: average(
        nutritionDays.map((d) => d.nutrition.carboidratos)
      ),
      avgGorduras: average(nutritionDays.map((d) => d.nutrition.gorduras)),
      avgAguaLitros: average(nutritionDays.map((d) => d.nutrition.aguaLitros)),
    },
    sleep: {
      daysWithData: sleepDays.length,
      avgSleepMin: average(sleepDays.map((d) => d.amazfit.sonoTotalMin)),
    },
    steps: {
      daysWithData: stepsDays.length,
      avgSteps: average(stepsDays.map((d) => d.amazfit.passos)),
      totalSteps: stepsDays.reduce((sum, d) => sum + d.amazfit.passos, 0),
    },
    recovery: {
      avgHrvMs: average(hrvDays.map((d) => d.amazfit.hrvMs)),
      avgPai: average(paiDays.map((d) => d.amazfit.pai)),
    },
    weight: {
      start: weightStart,
      end: weightEnd,
      deltaKg:
        weightStart != null && weightEnd != null
          ? Number((weightEnd - weightStart).toFixed(1))
          : null,
      samples: weightPoints.length,
    },
    workouts: {
      hevyCount: hevyInWindow.length,
      hevyVolumeKg: hevyInWindow.reduce(
        (sum, w) => sum + (w.volumeKg ?? 0),
        0
      ),
      zeppCount: zeppInWindow.length,
      zeppDistanceKm: Number(
        zeppInWindow.reduce((sum, s) => sum + s.distanciaKm, 0).toFixed(1)
      ),
    },
  }
}
