/**
 * Gera GOOGLE_REFRESH_TOKEN para Google Calendar (rodar uma vez).
 *
 * Pré-requisitos:
 * 1. Google Cloud Console → APIs & Services → Enable "Google Calendar API"
 * 2. OAuth client (Desktop app ou Web) com redirect URI: http://localhost:3000/oauth2callback
 * 3. .env.local com GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
 *
 * Uso: node scripts/get-gcal-token.mjs
 */

import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { google } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
const REDIRECT_URI = "http://localhost:3000/oauth2callback"

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

async function main() {
  const env = { ...process.env, ...loadEnvLocal() }
  const clientId = env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    console.error(
      "Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env.local antes de rodar este script."
    )
    process.exit(1)
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    REDIRECT_URI
  )

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  })

  console.log("\n1. Abra esta URL no navegador e autorize o acesso:\n")
  console.log(authUrl)
  console.log(
    "\n2. Cole o código de autorização (ou a URL completa do redirect):\n"
  )

  const rl = createInterface({ input, output })
  const raw = (await rl.question("Código: ")).trim()
  await rl.close()

  const code = raw.includes("code=")
    ? new URL(raw).searchParams.get("code")
    : raw

  if (!code) {
    console.error("Código inválido.")
    process.exit(1)
  }

  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.refresh_token) {
    console.error(
      "Nenhum refresh_token retornado. Revogue o acesso em myaccount.google.com/permissions e rode de novo com prompt consent."
    )
    process.exit(1)
  }

  console.log("\nAdicione ao .env.local:\n")
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
  console.log("\nOpcional:")
  console.log("GOOGLE_CALENDAR_ID=primary")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
