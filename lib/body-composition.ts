import { cache } from "react"

import {
  formatMeasurementDateLabel,
  mapMeasurementRow,
  MEASUREMENT_SELECT,
  type MeasurementRecord,
} from "@/lib/biometry"
import type {
  BodyCompositionDelta,
  BodyCompositionDeltasResult,
} from "@/lib/body-composition-shared"
import { MEASUREMENTS_HISTORY_START_DATE } from "@/lib/data"
import { createServerSupabase } from "@/lib/supabase/server"

export type { BodyCompositionDelta, BodyCompositionDeltasResult } from "@/lib/body-composition-shared"

const EMPTY_BODY_COMPOSITION: BodyCompositionDeltasResult = {
  data: "",
  dataLabel: "Sem medição",
  rows: [],
}

type MetricDef = {
  id: string
  label: string
  unit: string
  decimals: number
  lowerIsBetter: boolean
  value: (record: MeasurementRecord) => number | null
}

function averageValues(...values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value != null)
  if (valid.length === 0) return null
  return valid.reduce((sum, value) => sum + value, 0) / valid.length
}

const BODY_COMPOSITION_METRICS: MetricDef[] = [
  {
    id: "peso",
    label: "Peso",
    unit: "kg",
    decimals: 1,
    lowerIsBetter: true,
    value: (record) => record.peso,
  },
  {
    id: "cintura",
    label: "Cintura",
    unit: "cm",
    decimals: 1,
    lowerIsBetter: true,
    value: (record) => record.cintura,
  },
  {
    id: "abdomen",
    label: "Abdômen",
    unit: "cm",
    decimals: 1,
    lowerIsBetter: true,
    value: (record) => record.abdomen,
  },
  {
    id: "peitoral",
    label: "Peitoral",
    unit: "cm",
    decimals: 1,
    lowerIsBetter: false,
    value: (record) => record.peitoral,
  },
  {
    id: "bracos",
    label: "Braços",
    unit: "cm",
    decimals: 1,
    lowerIsBetter: false,
    value: (record) =>
      averageValues(record.biceps_dir, record.biceps_esq),
  },
  {
    id: "pernas",
    label: "Pernas",
    unit: "cm",
    decimals: 1,
    lowerIsBetter: false,
    value: (record) => averageValues(record.coxa_dir, record.coxa_esq),
  },
]

function buildDeltaRows(
  latest: MeasurementRecord,
  previous: MeasurementRecord | null
): BodyCompositionDelta[] {
  const rows: BodyCompositionDelta[] = []

  for (const metric of BODY_COMPOSITION_METRICS) {
    const atual = metric.value(latest)
    if (atual == null) continue

    const anterior = previous ? metric.value(previous) : null
    const delta =
      anterior == null ? null : Number((atual - anterior).toFixed(metric.decimals))

    rows.push({
      metricId: metric.id,
      metrica: metric.label,
      atual,
      delta,
      unit: metric.unit,
      decimals: metric.decimals,
      lowerIsBetter: metric.lowerIsBetter,
    })
  }

  return rows
}

export const getBodyCompositionDeltas = cache(
  async (): Promise<BodyCompositionDeltasResult> => {
    const supabase = createServerSupabase()
    if (!supabase) {
      console.log("[getBodyCompositionDeltas] Supabase não configurado — sem dados")
      return EMPTY_BODY_COMPOSITION
    }

    try {
      const { data, error } = await supabase
        .from("medidas")
        .select(MEASUREMENT_SELECT)
        .gte("data", MEASUREMENTS_HISTORY_START_DATE)
        .order("data", { ascending: false })
        .limit(2)

      if (error) throw error

      console.log("[getBodyCompositionDeltas] últimas medições Supabase:", {
        count: data?.length ?? 0,
        startDate: MEASUREMENTS_HISTORY_START_DATE,
        dates: (data ?? []).map((row) => String(row.data)),
      })

      if (!data?.length) {
        return EMPTY_BODY_COMPOSITION
      }

      const latest = mapMeasurementRow(data[0] as Record<string, unknown>)
      const previous =
        data.length > 1
          ? mapMeasurementRow(data[1] as Record<string, unknown>)
          : null

      const rows = buildDeltaRows(latest, previous)
      if (rows.length === 0) {
        return EMPTY_BODY_COMPOSITION
      }

      const result = {
        data: latest.data,
        dataLabel: formatMeasurementDateLabel(latest.data),
        rows,
      }

      console.log("[getBodyCompositionDeltas] deltas calculados:", {
        data: result.data,
        rowCount: rows.length,
        previousDate: previous?.data ?? null,
      })

      return result
    } catch (error) {
      console.error("[getBodyCompositionDeltas]", error)
      return EMPTY_BODY_COMPOSITION
    }
  }
)
