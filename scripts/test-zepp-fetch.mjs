/**
 * Testa fetch Zepp (não imprime segredos).
 * Uso: node scripts/test-zepp-fetch.mjs
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

function getBrtDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date())
}

const env = loadEnvLocal()
const userId = env.ZEPP_USER_ID?.trim()
const day = getBrtDateString()

if (!userId) {
  console.error("Falta ZEPP_USER_ID no .env.local")
  process.exit(1)
}

const headers = {
  Accept: "*/*",
  apptoken: "",
  appname: "com.huami.midong",
  appplatform: "ios_phone",
  channel: "appstore",
  country: "BR",
  lang: "pt_BR",
  timezone: "America/Sao_Paulo",
  "User-Agent": "Zepp/10.3.1 (iPhone; iOS 26.4.2; Scale/3.00)",
  v: "2.0",
}

const params = new URLSearchParams({
  query_type: "summary",
  device_type: "0",
  object_id: userId,
  from_date: day,
  to_date: day,
})

const url = `https://api-mifit-us3.zepp.com/v1/data/band_data.json?${params}`

console.log("Dia BRT:", day)
console.log("User ID:", userId.slice(0, 4) + "…")

async function tryToken(label, token) {
  if (!token) {
    console.log(`\n${label}: (não configurado)`)
    return false
  }

  const response = await fetch(url, {
    headers: { ...headers, apptoken: token },
  })
  const payload = await response.json().catch(() => ({}))
  const items = payload?.data ?? []
  console.log(`\n${label}:`)
  console.log("  HTTP:", response.status)
  console.log("  API code:", payload?.code ?? "(n/a)")
  console.log("  Message:", payload?.message ?? "(nenhuma)")
  console.log("  Items:", items.length)

  if (items[0]?.summary) {
    const pad =
      items[0].summary +
      "=".repeat((4 - (items[0].summary.length % 4)) % 4)
    const decoded = JSON.parse(Buffer.from(pad, "base64").toString("utf-8"))
    const stp = decoded.stp ?? {}
    const slp = decoded.slp ?? {}
    console.log("  Passos:", stp.ttl ?? 0)
    console.log(
      "  Sono (min):",
      (slp.dp ?? 0) + (slp.lt ?? 0) + (slp.dt ?? 0)
    )
    return true
  }

  return response.ok && items.length > 0
}

const appOk = await tryToken("ZEPP_APP_TOKEN", env.ZEPP_APP_TOKEN?.trim())
const bearerOk = await tryToken(
  "ZEPP_BEARER_TOKEN",
  env.ZEPP_BEARER_TOKEN?.trim()
)

if (!appOk && !bearerOk) {
  console.log(
    "\nNenhum token válido. Renove o apptoken no app Zepp (mitm/proxy) e atualize .env.local."
  )
  process.exit(1)
}
