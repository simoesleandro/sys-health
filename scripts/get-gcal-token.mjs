/**
 * Gera GOOGLE_REFRESH_TOKEN para Google Calendar (rodar uma vez).
 *
 * Pré-requisitos:
 * 1. Google Cloud Console → APIs & Services → Enable "Google Calendar API"
 * 2. OAuth client tipo "Computador/Desktop" (recomendado) OU Web com redirect URI cadastrado
 * 3. .env.local com GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET
 *
 * Uso: node scripts/get-gcal-token.mjs
 */

import { createServer } from "node:http"
import { createInterface } from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { exec } from "node:child_process"
import { google } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]
const REDIRECT_PATH = "/oauth2callback"
const PREFERRED_PORTS = [3030, 3456, 4280, 8765, 9299, 3000]

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

function buildRedirectUri(port) {
  return `http://127.0.0.1:${port}${REDIRECT_PATH}`
}

function openBrowser(url) {
  const platform = process.platform
  const command =
    platform === "win32"
      ? `start "" "${url}"`
      : platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`

  exec(command, (error) => {
    if (error) {
      console.log("Não foi possível abrir o navegador automaticamente. Copie a URL acima.")
    }
  })
}

function parseAuthCode(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (trimmed.includes("code=")) {
    try {
      const url = trimmed.startsWith("http")
        ? new URL(trimmed)
        : new URL(trimmed, "http://127.0.0.1/")
      return url.searchParams.get("code")
    } catch {
      return null
    }
  }

  return trimmed
}

function bindCallbackServer(port) {
  const redirectUri = buildRedirectUri(port)

  return new Promise((resolveBinding, rejectBinding) => {
    let settleCode

    const codePromise = new Promise((resolveCode) => {
      settleCode = resolveCode
    })

    const server = createServer((req, res) => {
      const requestUrl = new URL(req.url ?? "/", redirectUri)

      if (requestUrl.pathname !== REDIRECT_PATH) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
        res.end("Not found")
        return
      }

      const error = requestUrl.searchParams.get("error")
      const authCode = requestUrl.searchParams.get("code")

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" })
        res.end(
          `<h1>Erro na autorização</h1><p>${error}</p><p>Feche esta aba e veja o terminal.</p>`
        )
        server.close()
        rejectBinding(new Error(`Google retornou erro: ${error}`))
        return
      }

      if (!authCode) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" })
        res.end("<h1>Código ausente</h1><p>Feche esta aba e tente de novo.</p>")
        return
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      res.end(
        "<h1>Autorização concluída</h1><p>Volte ao terminal — o token será exibido em instantes.</p>"
      )

      server.close()
      settleCode(authCode)
    })

    server.on("error", rejectBinding)

    server.listen(port, "127.0.0.1", () => {
      console.log(`Servidor local aguardando callback em ${redirectUri}`)
      resolveBinding({ redirectUri, port, codePromise })
    })
  })
}

async function startCallbackServer() {
  const envPort = Number(process.env.GOOGLE_OAUTH_REDIRECT_PORT)
  const ports = Number.isFinite(envPort) && envPort > 0
    ? [envPort, ...PREFERRED_PORTS.filter((port) => port !== envPort)]
    : PREFERRED_PORTS

  let lastError = null

  for (const port of ports) {
    try {
      return await bindCallbackServer(port)
    } catch (error) {
      lastError = error
      const code = error && typeof error === "object" ? error.code : null
      if (code === "EADDRINUSE" || code === "EACCES") {
        console.warn(`Porta ${port} indisponível (${code}). Tentando outra...`)
        continue
      }
      throw error
    }
  }

  throw lastError ?? new Error("Nenhuma porta local disponível para o callback OAuth.")
}

async function askForCodeManually(redirectUri) {
  console.log(
    "\nCole a URL completa da barra de endereços (com ?code=...) ou só o código:\n"
  )
  const rl = createInterface({ input, output })
  const raw = (await rl.question("Código/URL: ")).trim()
  await rl.close()
  void redirectUri
  return parseAuthCode(raw)
}

async function main() {
  const env = { ...process.env, ...loadEnvLocal() }
  const clientId = env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    console.error(
      "Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no .env.local antes de rodar este script."
    )
    console.error(
      'Se perdeu o client secret, clique em "Add secret" no Google Cloud Console e copie o valor novo.'
    )
    process.exit(1)
  }

  console.log("\n=== Google Calendar — gerar refresh token ===\n")
  console.log(
    'Na tela do Google pode aparecer "HealthOS" ou "Syshealth" — é o app OAuth do projeto. Clique em "Continuar".\n'
  )
  console.log(
    "Cliente OAuth tipo Computador/Desktop: não precisa cadastrar redirect URI no Google Cloud.\n"
  )

  let code = null
  let redirectUri = buildRedirectUri(PREFERRED_PORTS[0])
  let oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

  try {
    const binding = await startCallbackServer()
    redirectUri = binding.redirectUri
    oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: SCOPES,
    })

    console.log("1. Abrindo o navegador para autorizar...\n")
    console.log(authUrl)
    openBrowser(authUrl)
    console.log("\n2. Após clicar em Continuar, aguarde — o script captura o código sozinho.\n")
    code = await binding.codePromise
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const sysCode =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : ""

    if (
      message.includes("EADDRINUSE") ||
      message.includes("EACCES") ||
      sysCode === "EADDRINUSE" ||
      sysCode === "EACCES" ||
      message.includes("Nenhuma porta local disponível")
    ) {
      console.warn("\nServidor local indisponível. Modo manual:\n")
      redirectUri = buildRedirectUri(PREFERRED_PORTS[0])
      oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
      })
      console.log("Abra esta URL, autorize, e cole a URL de retorno:\n")
      console.log(authUrl)
      code = await askForCodeManually(redirectUri)
    } else {
      throw error
    }
  }

  if (!code) {
    console.error("Código inválido. Cole a URL inteira (com ?code=...) ou o código.")
    process.exit(1)
  }

  let tokens
  try {
    ;({ tokens } = await oauth2Client.getToken(code))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Falha ao trocar o código por token:", message)

    if (message.includes("redirect_uri_mismatch")) {
      console.error(
        `\nRedirect URI usado: ${redirectUri}\n` +
          "Para cliente Web, cadastre esse URI em Authorized redirect URIs.\n" +
          "Para cliente Computador/Desktop, use o mesmo client_id/secret do console."
      )
    }

    if (message.includes("invalid_client")) {
      console.error(
        "\nGOOGLE_CLIENT_SECRET provavelmente está errado.\n" +
          'No Google Cloud Console → Credentials → Syshealth → "Add secret" e atualize o .env.local.'
      )
    }

    process.exit(1)
  }

  if (!tokens.refresh_token) {
    console.error(
      "Nenhum refresh_token retornado. Revogue o acesso em https://myaccount.google.com/permissions e rode de novo."
    )
    process.exit(1)
  }

  console.log("\nAdicione ao .env.local:\n")
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
  console.log("\nOpcional:")
  console.log("GOOGLE_CALENDAR_ID=primary")
  console.log("\nDepois reinicie o servidor (npm run dev) e teste com:")
  console.log("node scripts/test-gcal-fetch.mjs")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
