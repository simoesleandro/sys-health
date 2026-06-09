export type HevyApiSet = {
  index?: number
  type?: string
  weight_kg?: number | null
  reps?: number | null
}

export type HevyApiExercise = {
  title?: string
  exercise_name?: string
  sets?: HevyApiSet[]
}

export type HevyApiWorkout = {
  id: string
  title?: string
  start_time?: string
  end_time?: string
  created_at?: string
  exercises?: HevyApiExercise[]
}

export type HevyDbRow = {
  id: string
  data_hora: string
  titulo: string
  exercicios_json: string
  duracao_min: number | null
  volume_kg: number | null
}

const HEVY_API_BASE = "https://api.hevyapp.com"

export async function fetchHevyWorkoutsPage(
  apiKey: string,
  page = 1,
  pageSize = 50
) {
  const url = new URL(`${HEVY_API_BASE}/v1/workouts`)
  url.searchParams.set("page", String(page))
  url.searchParams.set("pageSize", String(pageSize))

  const response = await fetch(url, {
    headers: {
      "api-key": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(
      text || `Hevy API respondeu com status ${response.status}.`
    )
  }

  const payload = (await response.json()) as {
    workouts?: HevyApiWorkout[]
    page?: number
    page_count?: number
  }

  return {
    workouts: payload.workouts ?? [],
    page: payload.page ?? page,
    pageCount: payload.page_count ?? 1,
  }
}

export function mapHevyWorkoutToRow(workout: HevyApiWorkout): HevyDbRow {
  const exercises = (workout.exercises ?? []).map((exercise) => {
    const sets = (exercise.sets ?? []).map((set, index) => ({
      index: Number(set.index ?? index + 1),
      type: String(set.type ?? "normal"),
      weight_kg: set.weight_kg == null ? null : Number(set.weight_kg),
      reps: set.reps == null ? null : Number(set.reps),
    }))

    return {
      title: String(exercise.title ?? exercise.exercise_name ?? "Exercício"),
      sets,
    }
  })

  let volumeKg = 0
  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      if (
        set.weight_kg != null &&
        set.weight_kg > 0 &&
        set.reps != null &&
        set.reps > 0
      ) {
        volumeKg += set.weight_kg * set.reps
      }
    }
  }

  const startIso = workout.start_time ?? workout.created_at ?? null
  const endIso = workout.end_time ?? null
  let duracaoMin: number | null = null

  if (startIso && endIso) {
    const diff = Date.parse(endIso) - Date.parse(startIso)
    if (Number.isFinite(diff) && diff > 0) {
      duracaoMin = Math.round(diff / 60_000)
    }
  }

  const dataHora = startIso
    ? new Date(startIso).toISOString()
    : new Date().toISOString()

  return {
    id: String(workout.id),
    data_hora: dataHora,
    titulo: String(workout.title ?? "Treino"),
    exercicios_json: JSON.stringify(exercises),
    duracao_min: duracaoMin,
    volume_kg: volumeKg > 0 ? Math.round(volumeKg) : null,
  }
}
