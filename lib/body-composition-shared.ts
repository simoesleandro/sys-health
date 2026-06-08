export type BodyCompositionDelta = {
  metrica: string
  metricId: string
  atual: number
  delta: number | null
  unit: string
  decimals: number
  lowerIsBetter: boolean
}

export type BodyCompositionDeltasResult = {
  data: string
  dataLabel: string
  rows: BodyCompositionDelta[]
}

export function deltaSentiment(row: BodyCompositionDelta) {
  if (row.delta == null || Math.abs(row.delta) < 0.05) return "neutral" as const
  const decreased = row.delta < 0
  const improved = row.lowerIsBetter ? decreased : !decreased
  return improved ? ("positive" as const) : ("negative" as const)
}
