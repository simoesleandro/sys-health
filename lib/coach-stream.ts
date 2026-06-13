import type { GoogleLanguageModelOptions } from "@ai-sdk/google"
import { smoothStream } from "ai"

const DEFAULT_THINKING_BUDGET = 2048
const DEFAULT_STREAM_DELAY_MS = 28

function parsePositiveInt(raw: string | undefined, fallback: number) {
  const parsed = Number(raw?.trim())
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.round(parsed)
}

export function getCoachStreamDelayMs() {
  return parsePositiveInt(process.env.COACH_STREAM_DELAY_MS, DEFAULT_STREAM_DELAY_MS)
}

export function getGeminiThinkingBudget() {
  return parsePositiveInt(process.env.GEMINI_THINKING_BUDGET, DEFAULT_THINKING_BUDGET)
}

export function getCoachSmoothStreamTransform() {
  return smoothStream({
    delayInMs: getCoachStreamDelayMs(),
    chunking: "word",
  })
}

export function getCoachGoogleProviderOptions(): {
  google: GoogleLanguageModelOptions
} {
  return {
    google: {
      thinkingConfig: {
        includeThoughts: true,
        thinkingBudget: getGeminiThinkingBudget(),
      },
    },
  }
}
