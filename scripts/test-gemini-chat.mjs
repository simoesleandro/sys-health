/**
 * Testa a chave Gemini (não imprime segredos).
 * Uso: node scripts/test-gemini-chat.mjs
 *      node scripts/test-gemini-chat.mjs --stream
 *      node scripts/test-gemini-chat.mjs --thinking
 */

import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText, smoothStream, streamText } from "ai"

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

function normalizeModel(raw) {
  const trimmed = raw?.trim() ?? ""
  if (!trimmed) return "gemini-2.5-flash"
  return trimmed.startsWith("models/") ? trimmed.slice("models/".length) : trimmed
}

function fingerprint(key) {
  if (!key) return "(vazio)"
  return `${key.slice(0, 6)}...${key.slice(-4)} (${key.length} chars)`
}

async function runGenerate(google, modelId) {
  const result = await generateText({
    model: google(modelId),
    prompt: "Responda apenas: OK",
  })
  console.log("generateText OK —", result.text.trim())
}

async function runStream(google, modelId) {
  const system = [
    "Você é o SYS.HEALTH Coach.",
    "Baseie as respostas em dados reais. Responda em Markdown conciso.",
  ].join(" ")

  const result = streamText({
    model: google(modelId),
    system,
    messages: [
      {
        role: "user",
        content:
          "Como foram meus treinos de musculação e corrida nesta semana? O que devo melhorar?",
      },
    ],
  })

  let text = ""
  for await (const part of result.textStream) {
    text += part
  }

  console.log("streamText OK —", text.slice(0, 160).replace(/\s+/g, " "))
}

async function runThinking(google, modelId) {
  const result = streamText({
    model: google(modelId),
    prompt:
      "Analisa hipoteticamente uma semana com 3 treinos de musculação e 2 corridas. O que observarias?",
    providerOptions: {
      google: {
        thinkingConfig: {
          includeThoughts: true,
          thinkingBudget: 1024,
        },
      },
    },
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "word",
    }),
  })

  let reasoning = ""
  let text = ""

  for await (const part of result.fullStream) {
    if (part.type === "reasoning-delta") {
      reasoning += part.text
      process.stdout.write(".")
    }
    if (part.type === "text-delta") {
      text += part.text
    }
  }

  console.log("")
  console.log(
    "reasoning OK —",
    reasoning.slice(0, 160).replace(/\s+/g, " ") || "(vazio)"
  )
  console.log("text OK —", text.slice(0, 160).replace(/\s+/g, " "))
}

async function main() {
  const env = { ...process.env, ...loadEnvLocal() }
  const geminiKey = env.GEMINI_API_KEY?.trim() || null
  const legacyKey = env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || null
  const apiKey = geminiKey || legacyKey
  const modelId = normalizeModel(env.GEMINI_MODEL)
  const useStream = process.argv.includes("--stream")
  const useThinking = process.argv.includes("--thinking")

  if (!apiKey) {
    console.error("Falta GEMINI_API_KEY no .env.local")
    process.exit(1)
  }

  console.log(`Modelo: ${modelId}`)
  console.log(`GEMINI_API_KEY: ${fingerprint(geminiKey)}`)
  if (legacyKey) {
    console.log(`GOOGLE_GENERATIVE_AI_API_KEY: ${fingerprint(legacyKey)}`)
    if (geminiKey && legacyKey !== geminiKey) {
      console.warn(
        "AVISO: as duas variáveis existem e são DIFERENTES. O app usa GEMINI_API_KEY."
      )
    }
  }

  const google = createGoogleGenerativeAI({ apiKey })

  try {
    if (useThinking) {
      await runThinking(google, modelId)
    } else if (useStream) {
      await runStream(google, modelId)
    } else {
      await runGenerate(google, modelId)
      console.log("\nDica: rode com --stream ou --thinking para simular o IA Coach.")
    }
  } catch (error) {
    const parts = []
    if (error instanceof Error) {
      parts.push(error.message)
      if (error.cause instanceof Error) parts.push(error.cause.message)
    } else {
      parts.push(String(error))
    }

    console.error("ERRO:", parts.join(" | "))

    const lower = parts.join(" ").toLowerCase()
    if (lower.includes("prepayment credits are depleted")) {
      console.error(
        "\nA API retornou créditos esgotados para ESTA chave.\n" +
          "Confira no AI Studio se a chave ativa é exatamente a mesma (últimos 4 caracteres)."
      )
    }

    process.exit(1)
  }
}

main()
