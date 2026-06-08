export type MeasurementInput = {
  peso: number | null
  cintura: number | null
  abdomen: number | null
  peitoral: number | null
  quadril: number | null
  coxa_dir: number | null
  coxa_esq: number | null
  panturrilha_dir: number | null
  panturrilha_esq: number | null
  biceps_dir: number | null
  biceps_esq: number | null
}

export type MeasurementRecord = MeasurementInput & {
  id: number
  data: string
}

export type LatestMeasurementSummary = {
  peso: number | null
  data: string | null
  dataLabel: string | null
}

export const MEASUREMENT_FIELDS = [
  { key: "peso", label: "Peso (kg)" },
  { key: "cintura", label: "Cintura (cm)" },
  { key: "abdomen", label: "Abdômen (cm)" },
  { key: "peitoral", label: "Peitoral (cm)" },
  { key: "quadril", label: "Quadril (cm)" },
  { key: "coxa_dir", label: "Coxa dir. (cm)" },
  { key: "coxa_esq", label: "Coxa esq. (cm)" },
  { key: "panturrilha_dir", label: "Panturrilha dir. (cm)" },
  { key: "panturrilha_esq", label: "Panturrilha esq. (cm)" },
  { key: "biceps_dir", label: "Bíceps dir. (cm)" },
  { key: "biceps_esq", label: "Bíceps esq. (cm)" },
] as const satisfies ReadonlyArray<{
  key: keyof MeasurementInput
  label: string
}>

export const EMPTY_MEASUREMENT_INPUT: MeasurementInput = {
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

export function formatMeasurementDateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  const parsed = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed)
}

export function formatWeightKg(peso: number | null) {
  if (peso == null) return "—"
  return Number.isInteger(peso) ? `${peso} kg` : `${peso.toFixed(1)} kg`
}

export const MEASUREMENT_SELECT =
  "id, data, peso, cintura, abdomen, peitoral, quadril, coxa_dir, coxa_esq, panturrilha_dir, panturrilha_esq, biceps_dir, biceps_esq"

export function mapMeasurementRow(row: Record<string, unknown>): MeasurementRecord {
  return {
    id: Number(row.id),
    data: String(row.data),
    peso: row.peso == null ? null : Number(row.peso),
    cintura: row.cintura == null ? null : Number(row.cintura),
    abdomen: row.abdomen == null ? null : Number(row.abdomen),
    peitoral: row.peitoral == null ? null : Number(row.peitoral),
    quadril: row.quadril == null ? null : Number(row.quadril),
    coxa_dir: row.coxa_dir == null ? null : Number(row.coxa_dir),
    coxa_esq: row.coxa_esq == null ? null : Number(row.coxa_esq),
    panturrilha_dir:
      row.panturrilha_dir == null ? null : Number(row.panturrilha_dir),
    panturrilha_esq:
      row.panturrilha_esq == null ? null : Number(row.panturrilha_esq),
    biceps_dir: row.biceps_dir == null ? null : Number(row.biceps_dir),
    biceps_esq: row.biceps_esq == null ? null : Number(row.biceps_esq),
  }
}
