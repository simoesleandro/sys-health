import { cookies } from "next/headers"
import { cache } from "react"

import {
  formatMeasurementDateLabel,
  mapMeasurementRow,
  MEASUREMENT_SELECT,
  type LatestMeasurementSummary,
  type MeasurementInput,
  type MeasurementRecord,
} from "@/lib/biometry"
import type { FavoriteFood } from "@/lib/foods"
import { NUTRITION_GOALS } from "@/lib/goals"
import {
  getBristolLabel,
  type BristolType,
  type EvacuationRecord,
} from "@/lib/evacuation"
import {
  MOCK_ACTIVE_MEDICATIONS,
  type ActiveMedication,
  type MedicationChecklistItem,
} from "@/lib/medications"
import { createServerSupabase } from "@/lib/supabase/server"
import { SYNC_FRESHNESS_HOURS } from "@/lib/sync-env"
import {
  VISUAL_SUPPLEMENTS,
  WHEY_LEGACY_DESCRICAO,
  type SupplementGridItem,
} from "@/lib/supplements"
import {
  formatWorkoutDateLabel,
  mapZeppRunningRow,
  mapZeppWorkoutDbRow,
  parseHevyExercises,
  type HevyWorkout,
  type ZeppRunSession,
} from "@/lib/treinos"

export type TodayNutritionTotals = {
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
  aguaLitros: number
}

export type TodayAmazfitData = {
  passos: number
  caloriasGastas: number
  sonoTotalMin: number
  hrvMs: number
  pai: number
  /** true quando existe registo amazfit_dados para o dia (BRT) */
  synced: boolean
}

const EMPTY_TOTALS: TodayNutritionTotals = {
  calorias: 0,
  proteinas: 0,
  carboidratos: 0,
  gorduras: 0,
  aguaLitros: 0,
}

const EMPTY_AMAZFIT: TodayAmazfitData = {
  passos: 0,
  caloriasGastas: 0,
  sonoTotalMin: 0,
  hrvMs: 0,
  pai: 0,
  synced: false,
}

/** Limites UTC [início, fim) do dia civil em America/Sao_Paulo. */
export function getBrtTodayUtcBounds(now = new Date()) {
  return getBrtUtcBoundsForOffset(0, now)
}

/** Limites UTC [início, fim) para uma data civil BRT (YYYY-MM-DD). */
export function getBrtUtcBoundsForDate(brtDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(brtDate)
  if (!match) {
    return getBrtUtcBoundsForOffset(1)
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const start = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0))
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return {
    brtDate: `${match[1]}-${match[2]}-${match[3]}`,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

/** Limites UTC de um dia civil em BRT (0 = hoje, 1 = ontem, …). */
export function getBrtUtcBoundsForOffset(daysAgo = 0, now = new Date()) {
  const brtDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(now)

  const [year, month, day] = brtDate.split("-").map(Number)
  const start = new Date(
    Date.UTC(year, month - 1, day - daysAgo, 3, 0, 0, 0)
  )
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  const dayLabel = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(start.getTime() + 12 * 60 * 60 * 1000))

  return {
    brtDate: dayLabel,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

async function fetchNutritionTotalsForBounds(
  startIso: string,
  endIso: string
): Promise<TodayNutritionTotals> {
  const supabase = createServerSupabase()
  if (!supabase) return EMPTY_TOTALS

  try {
    const [refeicoesResult, aguaResult] = await Promise.all([
      supabase
        .from("refeicoes")
        .select("calorias, proteinas, carboidratos, gorduras")
        .gte("data_hora", startIso)
        .lt("data_hora", endIso),
      supabase
        .from("agua")
        .select("quantidade_ml")
        .gte("data_hora", startIso)
        .lt("data_hora", endIso),
    ])

    if (refeicoesResult.error) throw refeicoesResult.error
    if (aguaResult.error) throw aguaResult.error

    const calorias = (refeicoesResult.data ?? []).reduce(
      (sum, row) => sum + Number(row.calorias ?? 0),
      0
    )
    const proteinas = (refeicoesResult.data ?? []).reduce(
      (sum, row) => sum + Number(row.proteinas ?? 0),
      0
    )
    const carboidratos = (refeicoesResult.data ?? []).reduce(
      (sum, row) => sum + Number(row.carboidratos ?? 0),
      0
    )
    const gorduras = (refeicoesResult.data ?? []).reduce(
      (sum, row) => sum + Number(row.gorduras ?? 0),
      0
    )
    const aguaMl = (aguaResult.data ?? []).reduce(
      (sum, row) => sum + Number(row.quantidade_ml ?? 0),
      0
    )

    return {
      calorias,
      proteinas,
      carboidratos,
      gorduras,
      aguaLitros: aguaMl / 1000,
    }
  } catch (error) {
    console.error("[fetchNutritionTotalsForBounds]", error)
    return EMPTY_TOTALS
  }
}

async function fetchAmazfitDataForBrtDate(
  brtDate: string
): Promise<TodayAmazfitData> {
  const supabase = createServerSupabase()
  if (!supabase) return EMPTY_AMAZFIT

  try {
    const { data, error } = await supabase
      .from("amazfit_dados")
      .select(
        "data_hora, passos, calorias_gastas, sono_total_min, hrv_ms, pai"
      )
      .like("data_hora", `${brtDate}%`)
      .order("data_hora", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!data) return EMPTY_AMAZFIT

    return {
      passos: Number(data.passos ?? 0),
      caloriasGastas: Number(data.calorias_gastas ?? 0),
      sonoTotalMin: Number(data.sono_total_min ?? 0),
      hrvMs: Number(data.hrv_ms ?? 0),
      pai: Number(data.pai ?? 0),
      synced: true,
    }
  } catch (error) {
    console.error("[fetchAmazfitDataForBrtDate]", error)
    return EMPTY_AMAZFIT
  }
}

export const getNutritionTotalsForDate = cache(
  async (brtDate: string): Promise<TodayNutritionTotals> => {
    const { startIso, endIso } = getBrtUtcBoundsForDate(brtDate)
    return fetchNutritionTotalsForBounds(startIso, endIso)
  }
)

export const getAmazfitDataForDate = cache(
  async (brtDate: string): Promise<TodayAmazfitData> => {
    return fetchAmazfitDataForBrtDate(brtDate)
  }
)

export const getTodayNutritionTotals = cache(
  async (): Promise<TodayNutritionTotals> => {
    const { brtDate } = getBrtTodayUtcBounds()
    return getNutritionTotalsForDate(brtDate)
  }
)

export const getYesterdayNutritionTotals = cache(
  async (): Promise<TodayNutritionTotals> => {
    const { brtDate } = getBrtUtcBoundsForOffset(1)
    return getNutritionTotalsForDate(brtDate)
  }
)

export const getTodayAmazfitData = cache(
  async (): Promise<TodayAmazfitData> => {
    const { brtDate } = getBrtTodayUtcBounds()
    return getAmazfitDataForDate(brtDate)
  }
)

export const getYesterdayAmazfitData = cache(
  async (): Promise<TodayAmazfitData> => {
    const { brtDate } = getBrtUtcBoundsForOffset(1)
    return getAmazfitDataForDate(brtDate)
  }
)

export const getDayHistorySummary = cache(async (brtDate: string) => {
  const [nutrition, amazfit] = await Promise.all([
    getNutritionTotalsForDate(brtDate),
    getAmazfitDataForDate(brtDate),
  ])

  return {
    brtDate,
    nutrition,
    amazfit,
    kpi: formatKpiValues(nutrition, amazfit),
    passos: amazfit.synced
      ? amazfit.passos.toLocaleString("pt-BR")
      : "—",
    sono: amazfit.synced
      ? formatSleepMinutes(amazfit.sonoTotalMin)
      : "—",
  }
})

export const getCoachHealthContext = cache(async () => {
  const [
    todayNutrition,
    yesterdayNutrition,
    todayAmazfit,
    yesterdayAmazfit,
    todayBounds,
    yesterdayBounds,
  ] = await Promise.all([
    getTodayNutritionTotals(),
    getYesterdayNutritionTotals(),
    getTodayAmazfitData(),
    getYesterdayAmazfitData(),
    Promise.resolve(getBrtTodayUtcBounds()),
    Promise.resolve(getBrtUtcBoundsForOffset(1)),
  ])

  return {
    today: {
      date: todayBounds.brtDate,
      nutrition: todayNutrition,
      amazfit: todayAmazfit,
    },
    yesterday: {
      date: yesterdayBounds.brtDate,
      nutrition: yesterdayNutrition,
      amazfit: yesterdayAmazfit,
    },
  }
})

/** Saldo = TMB + calorias ativas (Amazfit) − calorias consumidas (nutrição). */
export function calculateBalance(
  caloriasConsumidas: number,
  caloriasAmazfit: number
) {
  return (
    NUTRITION_GOALS.TMB_KCAL +
    caloriasAmazfit -
    Math.round(caloriasConsumidas)
  )
}

export function formatBalance(
  caloriasConsumidas: number,
  caloriasAmazfit: number
) {
  const saldo = calculateBalance(caloriasConsumidas, caloriasAmazfit)

  if (saldo > 0) {
    return `Déficit ${saldo.toLocaleString("pt-BR")}`
  }
  if (saldo < 0) {
    return `Superávit ${Math.abs(saldo).toLocaleString("pt-BR")}`
  }
  return "Equilíbrio"
}

export function formatSleepMinutes(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h${m.toString().padStart(2, "0")}`
}

export function formatKpiValues(
  totals: TodayNutritionTotals,
  amazfit: TodayAmazfitData
) {
  return {
    calorias: `${Math.round(totals.calorias).toLocaleString("pt-BR")} / ${NUTRITION_GOALS.TMB_KCAL.toLocaleString("pt-BR")}`,
    proteina: `${Math.round(totals.proteinas)}g / ${NUTRITION_GOALS.PROTEIN_G}g`,
    agua: `${totals.aguaLitros.toFixed(1)}L / ${NUTRITION_GOALS.WATER_L}L`,
    balanco: formatBalance(totals.calorias, amazfit.caloriasGastas),
  }
}

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

/** Normaliza data_hora do Postgres/Supabase para instante UTC (ms). */
export function parseDataHoraUtcMs(dataHora: string) {
  const trimmed = dataHora.trim()
  const iso = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T")

  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(iso)
  const normalized = hasTimezone ? iso : `${iso}Z`

  const ms = Date.parse(normalized)
  return Number.isNaN(ms) ? 0 : ms
}

export function formatMealTimeBrt(dataHora: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(parseDataHoraUtcMs(dataHora)))
}

/** Mais recente primeiro — alinhado ao ORDER BY data_hora DESC do Streamlit. */
function sortMealsByDataHoraDesc(meals: TodayMeal[]) {
  return [...meals].sort(
    (a, b) =>
      parseDataHoraUtcMs(b.dataHora) - parseDataHoraUtcMs(a.dataHora) ||
      b.id - a.id
  )
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

export const getTodayMeals = cache(async (): Promise<TodayMeal[]> => {
  const supabase = createServerSupabase()
  if (!supabase) return []

  const { startIso, endIso } = getBrtTodayUtcBounds()

  try {
    const { data, error } = await supabase
      .from("refeicoes")
      .select(
        "id, data_hora, categoria, descricao, calorias, proteinas, carboidratos, gorduras, componentes_json"
      )
      .gte("data_hora", startIso)
      .lt("data_hora", endIso)
      .order("data_hora", { ascending: false })

    if (error) throw error

    const meals = (data ?? []).map((row) => ({
      id: Number(row.id),
      dataHora: String(row.data_hora),
      categoria: String(row.categoria ?? "Refeição"),
      descricao: String(row.descricao ?? ""),
      calorias: Number(row.calorias ?? 0),
      proteinas: Number(row.proteinas ?? 0),
      carboidratos: Number(row.carboidratos ?? 0),
      gorduras: Number(row.gorduras ?? 0),
      componentes: parseComponentesJson(
        row.componentes_json as string | null,
        String(row.descricao ?? "")
      ),
    }))

    return sortMealsByDataHoraDesc(meals)
  } catch (error) {
    console.error("[getTodayMeals]", error)
    return []
  }
})

function mealMatchesSupplement(
  meal: TodayMeal,
  preset: (typeof VISUAL_SUPPLEMENTS)[number]
) {
  if (meal.descricao === preset.descricao) return true

  return meal.componentes.some((component) => component.nome === preset.label)
}

function assignLegacyWheySlot(
  takenByPresetId: Map<string, number>,
  mealId: number
) {
  if (!takenByPresetId.has("whey-1")) {
    takenByPresetId.set("whey-1", mealId)
    return
  }
  if (!takenByPresetId.has("whey-2")) {
    takenByPresetId.set("whey-2", mealId)
  }
}

export const getTodaySupplementGrid = cache(async () => {
  const meals = await getTodayMeals()
  const takenByPresetId = new Map<string, number>()

  for (const meal of meals) {
    if (
      meal.descricao === WHEY_LEGACY_DESCRICAO ||
      (meal.componentes.some(
        (component) => component.nome === "Whey Isolado Dux 30g"
      ) &&
        !meal.descricao.includes("Dose"))
    ) {
      assignLegacyWheySlot(takenByPresetId, meal.id)
      continue
    }

    for (const preset of VISUAL_SUPPLEMENTS) {
      if (takenByPresetId.has(preset.id)) continue
      if (!mealMatchesSupplement(meal, preset)) continue
      takenByPresetId.set(preset.id, meal.id)
    }
  }

  return VISUAL_SUPPLEMENTS.map(
    (preset): SupplementGridItem => ({
      ...preset,
      isTaken: takenByPresetId.has(preset.id),
      mealId: takenByPresetId.get(preset.id) ?? null,
    })
  )
})

const HISTORY_DAYS = 14

export type HistoryDayLabel = {
  date: string
  label: string
}

export type WeightHistoryPoint = HistoryDayLabel & {
  peso: number | null
}

export type WeightHistoryStart = {
  peso: number
  date: string
  label: string
}

export type WeightHistoryResult = {
  points: WeightHistoryPoint[]
  start: WeightHistoryStart | null
}

function formatWeightChartDateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  const shortYear = String(year).slice(-2)
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${shortYear}`
}

export function buildWeightHistoryStart(
  points: WeightHistoryPoint[]
): WeightHistoryStart | null {
  const first = points.find((point) => point.peso != null)
  if (!first || first.peso == null) return null

  return {
    peso: first.peso,
    date: first.date,
    label: formatWeightChartDateLabel(first.date),
  }
}

export type WearableTrendPoint = HistoryDayLabel & {
  sonoHoras: number | null
  hrv: number | null
}

function getBrtDateString(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(date)
}

/** Últimos 14 dias em BRT — ordem crescente para o eixo X. */
export function getLast14BrtDays(now = new Date()): HistoryDayLabel[] {
  const days: HistoryDayLabel[] = []

  for (let offset = HISTORY_DAYS - 1; offset >= 0; offset -= 1) {
    const day = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000)
    days.push({
      date: getBrtDateString(day),
      label: new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
      }).format(day),
    })
  }

  return days
}

/** Início do histórico de medidas corporais (deltas e tabela). */
export const MEASUREMENTS_HISTORY_START_DATE = "2026-04-01"

const WEIGHT_HISTORY_PAGE_SIZE = 1000

async function fetchAllWeightRecords(
  supabase: NonNullable<ReturnType<typeof createServerSupabase>>
) {
  const rows: { data: string; peso: number | string | null }[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from("medidas")
      .select("data, peso")
      .not("peso", "is", null)
      .order("data", { ascending: true })
      .range(offset, offset + WEIGHT_HISTORY_PAGE_SIZE - 1)

    if (error) throw error
    if (!data?.length) break

    rows.push(...data)
    if (data.length < WEIGHT_HISTORY_PAGE_SIZE) break
    offset += WEIGHT_HISTORY_PAGE_SIZE
  }

  return rows
}

/** Histórico completo de peso (tabela medidas) — sem filtro de data, ordem ascendente. */
export const getWeightHistory = cache(async (): Promise<WeightHistoryResult> => {
  const supabase = createServerSupabase()
  if (!supabase) {
    console.log("[getWeightHistory] Supabase não configurado — sem dados")
    return { points: [], start: null }
  }

  try {
    const data = await fetchAllWeightRecords(supabase)

    const points: WeightHistoryPoint[] = data
      .filter((row) => row.peso != null)
      .map((row) => {
        const date = String(row.data).slice(0, 10)
        return {
          date,
          label: formatWeightChartDateLabel(date),
          peso: Number(row.peso),
        }
      })

    const result = {
      points,
      start: buildWeightHistoryStart(points),
    }

    console.log("[getWeightHistory] registos Supabase:", {
      count: points.length,
      first: points[0] ?? null,
      last: points[points.length - 1] ?? null,
    })

    return result
  } catch (error) {
    console.error("[getWeightHistory]", error)
    return { points: [], start: null }
  }
})

/** Alias legado — mesmo histórico completo (não limita a 14 dias). */
export const getWeightHistory14Days = getWeightHistory

/** Histórico de medidas corporais desde 2026-04-01. */
export const getMeasurementsHistory = cache(
  async (): Promise<MeasurementRecord[]> => {
    const supabase = createServerSupabase()
    if (!supabase) {
      console.log("[getMeasurementsHistory] Supabase não configurado — sem dados")
      return []
    }

    try {
      const { data, error } = await supabase
        .from("medidas")
        .select(MEASUREMENT_SELECT)
        .gte("data", MEASUREMENTS_HISTORY_START_DATE)
        .order("data", { ascending: true })

      if (error) throw error

      const records = (data ?? []).map((row) =>
        mapMeasurementRow(row as Record<string, unknown>)
      )

      console.log("[getMeasurementsHistory] registos Supabase:", {
        count: records.length,
        startDate: MEASUREMENTS_HISTORY_START_DATE,
        first: records[0]?.data ?? null,
        last: records[records.length - 1]?.data ?? null,
      })

      return records
    } catch (error) {
      console.error("[getMeasurementsHistory]", error)
      return []
    }
  }
)

export const getWearableTrends14Days = cache(
  async (): Promise<WearableTrendPoint[]> => {
    const days = getLast14BrtDays()
    const supabase = createServerSupabase()

    if (!supabase) {
      return days.map((day) => ({ ...day, sonoHoras: null, hrv: null }))
    }

    const startDate = days[0]?.date
    if (!startDate) return []

    try {
      const { data, error } = await supabase
        .from("amazfit_dados")
        .select("data_hora, sono_total_min, hrv_ms")
        .gte("data_hora", `${startDate} 00:00:00`)
        .order("data_hora", { ascending: true })

      if (error) throw error

      const wearableByDate = new Map<
        string,
        { sonoHoras: number; hrv: number }
      >()

      for (const row of data ?? []) {
        const dateKey = String(row.data_hora).slice(0, 10)
        wearableByDate.set(dateKey, {
          sonoHoras: Math.round((Number(row.sono_total_min ?? 0) / 60) * 10) / 10,
          hrv: Number(row.hrv_ms ?? 0),
        })
      }

      return days.map((day) => {
        const entry = wearableByDate.get(day.date)
        return {
          ...day,
          sonoHoras: entry?.sonoHoras ?? null,
          hrv: entry?.hrv ?? null,
        }
      })
    } catch (error) {
      console.error("[getWearableTrends14Days]", error)
      return days.map((day) => ({ ...day, sonoHoras: null, hrv: null }))
    }
  }
)

function mapFavoriteFoodRow(row: Record<string, unknown>): FavoriteFood {
  return {
    id: Number(row.id),
    descricao: String(row.descricao ?? ""),
    categoria: String(row.categoria ?? "Lanche"),
    calorias: Number(row.calorias ?? 0),
    proteinas: Number(row.proteinas ?? 0),
    carboidratos: Number(row.carboidratos ?? 0),
    gorduras: Number(row.gorduras ?? 0),
    qtdReferencia: Number(row.qtd_referencia ?? 100),
    unidadeReferencia: String(row.unidade_referencia ?? "g"),
  }
}

export const getFavoriteFoods = cache(async (): Promise<FavoriteFood[]> => {
  const supabase = createServerSupabase()
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from("alimentos_favoritos")
      .select(
        "id, descricao, categoria, calorias, proteinas, carboidratos, gorduras, qtd_referencia, unidade_referencia"
      )
      .order("descricao", { ascending: true })

    if (error) throw error

    return (data ?? []).map((row) => mapFavoriteFoodRow(row))
  } catch (error) {
    console.error("[getFavoriteFoods]", error)
    return []
  }
})

export const getTodayMeasurement = cache(
  async (): Promise<MeasurementRecord | null> => {
    const supabase = createServerSupabase()
    if (!supabase) return null

    const { brtDate } = getBrtTodayUtcBounds()

    try {
      const { data, error } = await supabase
        .from("medidas")
        .select(MEASUREMENT_SELECT)
        .eq("data", brtDate)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      return mapMeasurementRow(data)
    } catch (error) {
      console.error("[getTodayMeasurement]", error)
      return null
    }
  }
)

export const getLatestMeasurement = cache(
  async (): Promise<LatestMeasurementSummary> => {
    const supabase = createServerSupabase()
    if (!supabase) {
      return { peso: null, data: null, dataLabel: null }
    }

    try {
      const { data, error } = await supabase
        .from("medidas")
        .select("data, peso")
        .not("peso", "is", null)
        .order("data", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      if (!data?.data) {
        return { peso: null, data: null, dataLabel: null }
      }

      const date = String(data.data)
      return {
        peso: data.peso == null ? null : Number(data.peso),
        data: date,
        dataLabel: formatMeasurementDateLabel(date),
      }
    } catch (error) {
      console.error("[getLatestMeasurement]", error)
      return { peso: null, data: null, dataLabel: null }
    }
  }
)

export function measurementToInput(
  record: MeasurementRecord | null
): MeasurementInput {
  if (!record) {
    return {
      peso: null,
      cintura: null,
      abdomen: null,
      peitoral: null,
      quadril: null,
      coxa_dir: null,
      coxa_esq: null,
      panturrilha_dir: null,
      panturrilha_esq: null,
      biceps_dir: null,
      biceps_esq: null,
    }
  }

  const {
    id: _id,
    data: _data,
    ...input
  } = record

  return input
}

export type SyncSourceStatus = {
  synced: boolean
  lastSyncAt: string | null
  statusLabel: string
}

export type SyncStatus = {
  amazfit: SyncSourceStatus
  hevy: SyncSourceStatus
}

/** Timestamps sem timezone do Supabase são interpretados como BRT (America/Sao_Paulo). */
export function parseBrtDataHoraMs(dataHora: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/.exec(
    dataHora.trim()
  )
  if (!match) return parseDataHoraUtcMs(dataHora)

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4] ?? "0")
  const minute = Number(match[5] ?? "0")
  const second = Number(match[6] ?? "0")

  return Date.UTC(year, month - 1, day, hour + 3, minute, second)
}

function getBrtCalendarDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(now)
}

function getBrtYesterdayCalendarDate(now = new Date()) {
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(yesterday)
}

function isSyncFresh(dataHora: string, freshnessHours: number, now = new Date()) {
  const dateMatch = /^(\d{4}-\d{2}-\d{2})/.exec(dataHora.trim())
  if (dateMatch) {
    const syncDate = dateMatch[1]
    const todayBrt = getBrtCalendarDate(now)
    const yesterdayBrt = getBrtYesterdayCalendarDate(now)
    if (syncDate === todayBrt || syncDate === yesterdayBrt) {
      return true
    }
  }

  const ms = parseBrtDataHoraMs(dataHora)
  if (ms <= 0) return false
  return now.getTime() - ms <= freshnessHours * 60 * 60 * 1000
}

export function formatSyncAgo(dataHora: string, now = new Date()) {
  const ms = parseBrtDataHoraMs(dataHora)
  if (ms <= 0) return "sem registo"

  const diffMin = Math.max(0, Math.floor((now.getTime() - ms) / 60_000))
  if (diffMin < 1) return "agora"
  if (diffMin < 60) return `há ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `há ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `há ${diffDays}d`
}

function buildSyncSourceStatus(
  lastSyncAt: string | null,
  freshnessHours: number
): SyncSourceStatus {
  if (!lastSyncAt) {
    return {
      synced: false,
      lastSyncAt: null,
      statusLabel: "pendente",
    }
  }

  const synced = isSyncFresh(lastSyncAt, freshnessHours)
  return {
    synced,
    lastSyncAt,
    statusLabel: synced
      ? `sincronizado ${formatSyncAgo(lastSyncAt)}`
      : "pendente",
  }
}

async function fetchLatestAmazfitSyncAt(): Promise<string | null> {
  const supabase = createServerSupabase()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from("amazfit_dados")
      .select("data_hora")
      .order("data_hora", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data?.data_hora ? String(data.data_hora) : null
  } catch (error) {
    console.error("[fetchLatestAmazfitSyncAt]", error)
    return null
  }
}

async function fetchLatestHevySyncAt(): Promise<string | null> {
  const supabase = createServerSupabase()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from("hevy_treinos")
      .select("data_hora")
      .order("data_hora", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data?.data_hora ? String(data.data_hora) : null
  } catch (error) {
    console.error("[fetchLatestHevySyncAt]", error)
    return null
  }
}

export const getSyncStatus = cache(async (): Promise<SyncStatus> => {
  const [amazfitLastSyncAt, hevyLastSyncAt] = await Promise.all([
    fetchLatestAmazfitSyncAt(),
    fetchLatestHevySyncAt(),
  ])

  const status = {
    amazfit: buildSyncSourceStatus(amazfitLastSyncAt, SYNC_FRESHNESS_HOURS),
    hevy: buildSyncSourceStatus(hevyLastSyncAt, SYNC_FRESHNESS_HOURS),
  }

  console.log("[getSyncStatus] última sync Supabase:", {
    amazfitLastSyncAt,
    hevyLastSyncAt,
    amazfitSynced: status.amazfit.synced,
    hevySynced: status.hevy.synced,
    freshnessHours: SYNC_FRESHNESS_HOURS,
  })

  return status
})

export const getRecentHevyWorkouts = cache(
  async (limit = 20): Promise<HevyWorkout[]> => {
    const supabase = createServerSupabase()
    if (!supabase) return []

    try {
      const { data, error } = await supabase
        .from("hevy_treinos")
        .select(
          "id, data_hora, titulo, exercicios_json, duracao_min, volume_kg"
        )
        .order("data_hora", { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data ?? []).map((row) => ({
        id: String(row.id),
        titulo: String(row.titulo ?? "Treino"),
        dataHora: String(row.data_hora ?? ""),
        dataLabel: formatWorkoutDateLabel(String(row.data_hora ?? "")),
        duracaoMin:
          row.duracao_min == null ? null : Number(row.duracao_min),
        volumeKg: row.volume_kg == null ? null : Number(row.volume_kg),
        exercicios: parseHevyExercises(row.exercicios_json),
      }))
    } catch (error) {
      console.error("[getRecentHevyWorkouts]", error)
      return []
    }
  }
)

/** Cardio Zepp — workouts detalhados (amazfit_workouts) com fallback em amazfit_dados. */
export const getZeppRunningSessions = cache(
  async (limit = 30): Promise<ZeppRunSession[]> => {
    const supabase = createServerSupabase()
    if (!supabase) {
      console.log("[getZeppRunningSessions] Supabase não configurado — sem dados")
      return []
    }

    try {
      const { data: workouts, error: workoutsError } = await supabase
        .from("amazfit_workouts")
        .select(
          "track_id, data_hora, tipo, distancia_km, duracao_minutos, fc_media, calorias, pace_segundos_por_km"
        )
        .gt("distancia_km", 0)
        .order("data_hora", { ascending: false })
        .limit(limit)

      if (workoutsError) {
        console.warn("[getZeppRunningSessions] amazfit_workouts:", workoutsError.message)
      }

      if (workouts?.length) {
        const sessions = workouts.map((row) => mapZeppWorkoutDbRow(row))
        console.log("[getZeppRunningSessions] workouts detalhados:", {
          count: sessions.length,
          latest: sessions[0] ?? null,
        })
        return sessions
      }

      const { data, error } = await supabase
        .from("amazfit_dados")
        .select("data_hora, corrida_km, corrida_cal")
        .gt("corrida_km", 0)
        .order("data_hora", { ascending: false })
        .limit(limit)

      if (error) throw error

      const sessions = (data ?? []).map((row) =>
        mapZeppRunningRow({
          data_hora: String(row.data_hora),
          corrida_km: row.corrida_km,
          corrida_cal: row.corrida_cal,
        })
      )

      console.log("[getZeppRunningSessions] fallback amazfit_dados:", {
        count: sessions.length,
        latest: sessions[0] ?? null,
      })

      return sessions
    } catch (error) {
      console.error("[getZeppRunningSessions]", error)
      return []
    }
  }
)

function mapActiveMedicationRow(row: Record<string, unknown>): ActiveMedication {
  return {
    id: Number(row.id),
    nome: String(row.nome ?? ""),
    dosagem: String(row.dosagem ?? ""),
    periodo: String(row.periodo ?? row.horario ?? ""),
  }
}

async function fetchActiveMedications(): Promise<ActiveMedication[]> {
  const supabase = createServerSupabase()
  if (!supabase) return MOCK_ACTIVE_MEDICATIONS

  try {
    const { data, error } = await supabase
      .from("medicamentos_ativos")
      .select("id, nome, dosagem, periodo, horario")
      .order("nome", { ascending: true })

    if (error) throw error
    if (!data?.length) return MOCK_ACTIVE_MEDICATIONS

    return data.map((row) => mapActiveMedicationRow(row))
  } catch (error) {
    console.error("[fetchActiveMedications]", error)
    return MOCK_ACTIVE_MEDICATIONS
  }
}

const MOCK_LOGS_COOKIE = "syshealth-medication-logs"

async function readMockTakenMedicationIds(brtDate: string) {
  const cookieStore = await cookies()
  const raw = cookieStore.get(MOCK_LOGS_COOKIE)?.value
  if (!raw) return new Set<number>()

  try {
    const parsed = JSON.parse(raw) as { date: string; takenIds: number[] }
    if (parsed.date !== brtDate) return new Set<number>()
    return new Set(parsed.takenIds)
  } catch {
    return new Set<number>()
  }
}

async function fetchTodayMedicationLogIds(
  brtDate: string
): Promise<Map<number, number>> {
  const supabase = createServerSupabase()
  const takenByMedicationId = new Map<number, number>()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("logs_medicacao")
        .select("id, medicamento_id, data")
        .eq("data", brtDate)

      if (error) throw error

      for (const row of data ?? []) {
        takenByMedicationId.set(
          Number(row.medicamento_id),
          Number(row.id)
        )
      }

      return takenByMedicationId
    } catch (error) {
      console.error("[fetchTodayMedicationLogIds]", error)
    }
  }

  const mockTakenIds = await readMockTakenMedicationIds(brtDate)
  for (const medicationId of mockTakenIds) {
    takenByMedicationId.set(medicationId, -1)
  }

  return takenByMedicationId
}

export const getTodayEvacuations = cache(
  async (): Promise<EvacuationRecord[]> => {
    const supabase = createServerSupabase()
    if (!supabase) return []

    const { startIso, endIso } = getBrtTodayUtcBounds()

    try {
      const { data, error } = await supabase
        .from("evacuacoes")
        .select("id, data_hora, observacao, esforco")
        .gte("data_hora", startIso)
        .lt("data_hora", endIso)
        .order("data_hora", { ascending: false })

      if (error) throw error

      return (data ?? []).map((row) => {
        const tipo = Number(row.esforco ?? 0)
        const dataHora = String(row.data_hora ?? "")

        return {
          id: Number(row.id),
          dataHora,
          horaLabel: formatMealTimeBrt(dataHora),
          tipo: tipo as BristolType,
          tipoLabel: getBristolLabel(tipo),
          observacao: row.observacao == null ? null : String(row.observacao),
        }
      })
    } catch (error) {
      console.error("[getTodayEvacuations]", error)
      return []
    }
  }
)

export const getMedicationChecklist = cache(
  async (): Promise<MedicationChecklistItem[]> => {
    const { brtDate } = getBrtTodayUtcBounds()
    const [medications, takenLogs] = await Promise.all([
      fetchActiveMedications(),
      fetchTodayMedicationLogIds(brtDate),
    ])

    return medications.map((medication) => {
      const logId = takenLogs.get(medication.id) ?? null
      return {
        ...medication,
        isTaken: logId != null,
        logId,
      }
    })
  }
)
