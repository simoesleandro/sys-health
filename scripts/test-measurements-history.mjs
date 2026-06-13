/**
 * Diagnóstico do destaque da última medição (não imprime segredos).
 * Uso: node scripts/test-measurements-history.mjs
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

function normalizeDate(value) {
  const raw = String(value).trim()
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw)
  return match ? match[1] : raw.slice(0, 10)
}

const env = loadEnvLocal()
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key =
  env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e chave Supabase no .env.local")
  process.exit(1)
}

const START = "2026-04-01"
const endpoint = `${url}/rest/v1/medidas?select=id,data,peso,cintura,user_id&data=gte.${START}&order=data.asc,id.asc`

const response = await fetch(endpoint, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
})

if (!response.ok) {
  console.error("Erro Supabase:", response.status, await response.text())
  process.exit(1)
}

const rows = await response.json()
const records = rows.map((row) => ({
  id: Number(row.id),
  dataRaw: row.data,
  data: normalizeDate(row.data),
  peso: row.peso,
  cintura: row.cintura,
  user_id: row.user_id ?? null,
}))

const latestByAt = records.at(-1) ?? null
const latestByReduce = records.reduce(
  (best, record) =>
    !best ||
    record.data > best.data ||
    (record.data === best.data && record.id > best.id)
      ? record
      : best,
  null
)

const latestPeso = [...records]
  .filter((r) => r.peso != null)
  .sort((a, b) => b.data.localeCompare(a.data))[0] ?? null

console.log("Registos medidas (desde", START + "):", records.length)
console.log("Primeiro:", records[0] ?? null)
console.log("Último (at -1, como na tabela):", latestByAt)
console.log("Último (reduce data+id):", latestByReduce)
console.log("Último com peso (card resumo):", latestPeso)

if (latestByAt && latestByReduce && latestByAt.id !== latestByReduce.id) {
  console.log("⚠️  IDs diferentes — destaque pode estar na linha errada")
}

const brtToday = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
}).format(new Date())

console.log("Data BRT hoje:", brtToday)
console.log(
  "Registo de hoje:",
  records.find((r) => r.data === brtToday) ?? "nenhum"
)

console.log("Último registo raw data:", latestByAt?.dataRaw ?? null)
const userIds = [...new Set(records.map((r) => r.user_id).filter(Boolean))]
console.log("user_ids distintos:", userIds.length, userIds.map((id) => id.slice(0, 8) + "…"))
console.log(
  "Sem user_id:",
  records.filter((r) => !r.user_id).map((r) => ({ id: r.id, data: r.data }))
)
