/**
 * Testa fetch da agenda de hoje (não imprime segredos).
 * Uso: node scripts/test-gcal-fetch.mjs
 */

import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { google } from "googleapis"

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

function getBrtTodayBounds() {
  const brtDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date())
  const [year, month, day] = brtDate.split("-").map(Number)
  const start = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0))
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { brtDate, timeMin: start.toISOString(), timeMax: end.toISOString() }
}

async function main() {
  const env = { ...process.env, ...loadEnvLocal() }
  const clientId = env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim()
  const refreshToken = env.GOOGLE_REFRESH_TOKEN?.trim()
  const calendarId = env.GOOGLE_CALENDAR_ID?.trim() || "primary"

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Faltam GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou GOOGLE_REFRESH_TOKEN.")
    process.exit(1)
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })
  const { brtDate, timeMin, timeMax } = getBrtTodayBounds()

  const response = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 10,
  })

  const events = response.data.items ?? []
  console.log(`OK — ${brtDate} (BRT): ${events.length} evento(s)`)
  for (const event of events.slice(0, 5)) {
    const start = event.start?.dateTime ?? event.start?.date ?? "?"
    console.log(`  - ${start} | ${event.summary ?? "Sem título"}`)
  }
}

main().catch((error) => {
  const message = error?.message ?? String(error)
  console.error("ERRO:", message)

  if (message.includes("invalid_grant")) {
    console.error(
      "\nO GOOGLE_REFRESH_TOKEN expirou ou foi revogado.\n" +
        "1. node scripts/get-gcal-token.mjs\n" +
        "2. Cole o novo GOOGLE_REFRESH_TOKEN no .env.local (e na Vercel, se for produção)\n" +
        "3. Reinicie o servidor (npm run dev)"
    )
  }

  process.exit(1)
})
