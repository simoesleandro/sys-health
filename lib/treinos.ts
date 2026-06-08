export type HevySet = {
  index: number
  type: string
  weightKg: number | null
  reps: number | null
}

export type HevyExercise = {
  title: string
  sets: HevySet[]
}

export type HevyWorkout = {
  id: string
  titulo: string
  dataHora: string
  dataLabel: string
  duracaoMin: number | null
  volumeKg: number | null
  exercicios: HevyExercise[]
}

export type ZeppActivityType = "Corrida" | "Caminhada"

export type ZeppRunSession = {
  id: string
  data: string
  dataLabel: string
  tipo: ZeppActivityType
  distanciaKm: number
  duracaoMinutos: number | null
  pace: string
  fcMedia: number | null
  calorias: number | null
}

export function calcPaceSecondsPerKm(
  duracaoMinutos: number,
  distanciaKm: number
): number | null {
  if (duracaoMinutos <= 0 || distanciaKm <= 0) return null
  return Math.round((duracaoMinutos * 60) / distanciaKm)
}

export function formatPaceSecondsPerKm(seconds: number | null) {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return "—"
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${minutes}:${String(secs).padStart(2, "0")} /km`
}

export function mapZeppWorkoutDbRow(row: {
  track_id: string
  data_hora: string
  tipo: string
  distancia_km: number | string | null
  duracao_minutos: number | string | null
  fc_media?: number | string | null
  calorias?: number | string | null
  pace_segundos_por_km?: number | string | null
}): ZeppRunSession {
  const distanciaKm = Number(row.distancia_km ?? 0)
  const duracaoMinutos = Number(row.duracao_minutos ?? 0)
  const fcMedia = Number(row.fc_media ?? 0)
  const calorias = Number(row.calorias ?? 0)
  const paceSeconds = calcPaceSecondsPerKm(duracaoMinutos, distanciaKm)
  const dataHora = String(row.data_hora)
  const data = dataHora.slice(0, 10)
  const tipo: ZeppActivityType =
    row.tipo === "Caminhada" ? "Caminhada" : "Corrida"

  return {
    id: String(row.track_id),
    data,
    dataLabel: formatWorkoutDateLabel(dataHora),
    tipo,
    distanciaKm,
    duracaoMinutos: duracaoMinutos > 0 ? duracaoMinutos : null,
    pace: formatPaceSecondsPerKm(paceSeconds),
    fcMedia: fcMedia > 0 ? fcMedia : null,
    calorias: calorias > 0 ? calorias : null,
  }
}

export function mapZeppRunningRow(row: {
  data_hora: string
  corrida_km: number | string | null
  corrida_cal?: number | string | null
}): ZeppRunSession {
  const dataHora = String(row.data_hora)
  const data = dataHora.slice(0, 10)
  const distanciaKm = Number(row.corrida_km ?? 0)
  const calorias = Number(row.corrida_cal ?? 0)

  return {
    id: dataHora,
    data,
    dataLabel: formatRunDateLabel(data),
    tipo: distanciaKm >= 3 ? "Corrida" : "Caminhada",
    distanciaKm,
    duracaoMinutos: null,
    pace: "—",
    fcMedia: null,
    calorias: calorias > 0 ? calorias : null,
  }
}

export function parseHevyExercises(raw: unknown): HevyExercise[] {
  if (!raw) return []

  let parsed: unknown = raw
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return []
    }
  }

  if (!Array.isArray(parsed)) return []

  return parsed
    .map((item) => {
      if (!item || typeof item !== "object") return null

      const exercise = item as Record<string, unknown>
      const setsRaw = Array.isArray(exercise.sets) ? exercise.sets : []

      const sets = setsRaw
        .map((setItem) => {
          if (!setItem || typeof setItem !== "object") return null
          const set = setItem as Record<string, unknown>

          return {
            index: Number(set.index ?? 0),
            type: String(set.type ?? "normal"),
            weightKg:
              set.weight_kg == null ? null : Number(set.weight_kg),
            reps: set.reps == null ? null : Number(set.reps),
          } satisfies HevySet
        })
        .filter((set): set is HevySet => set != null)

      return {
        title: String(exercise.title ?? "Exercício"),
        sets,
      } satisfies HevyExercise
    })
    .filter((exercise): exercise is HevyExercise => exercise != null)
}

export function formatWorkoutDateLabel(value: string) {
  const parsed = new Date(value.includes("T") ? value : `${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return value

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed)
}

export function formatRunDateLabel(value: string) {
  const datePart = value.slice(0, 10)
  const [year, month, day] = datePart.split("-").map(Number)
  const parsed = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed)
}

export function formatDurationMin(minutes: number | null) {
  if (minutes == null || minutes <= 0) return "—"
  return `${Math.round(minutes)} min`
}

export function formatVolumeKg(volume: number | null) {
  if (volume == null || !Number.isFinite(volume)) return "—"
  return `${Math.round(volume).toLocaleString("pt-BR")} kg`
}

export function formatDistanceKm(distance: number) {
  return `${distance.toFixed(2)} km`
}

export function formatPaceMinPerKm(pace: number | null) {
  if (pace == null || !Number.isFinite(pace) || pace <= 0) return "—"
  const minutes = Math.floor(pace)
  const seconds = Math.round((pace - minutes) * 60)
  return `${minutes}:${String(seconds).padStart(2, "0")} /km`
}

export function formatHeartRate(bpm: number | null) {
  if (bpm == null || bpm <= 0) return "—"
  return `${Math.round(bpm)} bpm`
}

export function formatRunCalories(calories: number | null) {
  if (calories == null || calories <= 0) return "—"
  return `${Math.round(calories)} kcal`
}

export function formatSetLabel(set: HevySet) {
  const weight =
    set.weightKg != null && set.weightKg > 0
      ? `${set.weightKg} kg`
      : "peso corporal"
  const reps = set.reps != null ? `${set.reps} reps` : "—"
  return `${weight} × ${reps}`
}
