/**
 * Inspeciona RPE nos treinos Hevy (DB + API opcional).
 * Uso: node scripts/test-hevy-rpe.mjs
 */

import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local")
  if (!existsSync(path)) return {}
  const vars = {}
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

const env = loadEnvLocal()
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key =
  env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const hevyKey = env.HEVY_API_KEY?.trim()

if (!url || !key) {
  console.error("Faltam variáveis Supabase no .env.local")
  process.exit(1)
}

const dbRes = await fetch(
  `${url}/rest/v1/hevy_treinos?select=id,titulo,data_hora,exercicios_json&order=data_hora.desc&limit=1`,
  {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  }
)

if (!dbRes.ok) {
  console.error("Erro DB:", dbRes.status, await dbRes.text())
  process.exit(1)
}

const [latest] = await dbRes.json()
if (!latest) {
  console.log("Nenhum treino no banco.")
  process.exit(0)
}

console.log("Último treino DB:", latest.titulo, latest.data_hora)

let exercises = latest.exercicios_json
if (typeof exercises === "string") {
  try {
    exercises = JSON.parse(exercises)
  } catch {
    exercises = []
  }
}

for (const exercise of exercises.slice(0, 3)) {
  const sets = exercise.sets ?? []
  const rpeSets = sets.filter((s) => s.rpe != null)
  console.log(
    `- ${exercise.title}: ${sets.length} séries, ${rpeSets.length} com rpe`,
    rpeSets[0] ?? sets[0] ?? null
  )
}

if (hevyKey) {
  const apiRes = await fetch(
    "https://api.hevyapp.com/v1/workouts?page=1&pageSize=1",
    {
      headers: { "api-key": hevyKey, Accept: "application/json" },
    }
  )

  if (!apiRes.ok) {
    console.error("Erro Hevy API:", apiRes.status)
    process.exit(1)
  }

  const payload = await apiRes.json()
  const workout = payload.workouts?.[0]
  if (workout) {
    console.log("\nÚltimo treino API:", workout.title)
    for (const exercise of (workout.exercises ?? []).slice(0, 3)) {
      const sets = exercise.sets ?? []
      const rpeSets = sets.filter((s) => s.rpe != null)
      console.log(
        `- ${exercise.title ?? exercise.exercise_name}: ${sets.length} séries, ${rpeSets.length} com rpe`,
        rpeSets[0] ?? sets[0] ?? null
      )
    }
  }
} else {
  console.log("\n(HEVY_API_KEY ausente — pulando comparação com API)")
}
