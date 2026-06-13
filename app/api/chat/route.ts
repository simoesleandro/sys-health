import { createGoogleGenerativeAI } from "@ai-sdk/google"
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai"

import { buildCoachSystemPrompt } from "@/lib/coach"
import {
  getCoachGoogleProviderOptions,
  getCoachSmoothStreamTransform,
} from "@/lib/coach-stream"
import { getCoachHealthContext } from "@/lib/data"
import { formatGeminiErrorMessage } from "@/lib/gemini-errors"
import { getGeminiApiKey } from "@/lib/gemini-env"
import {
  formatInvalidGeminiModelMessage,
  getGeminiModelId,
  isValidGeminiModelId,
} from "@/lib/gemini-model"
import { requireAuth } from "@/lib/supabase/auth"
import { getUserNutritionGoals } from "@/lib/user-settings"

export const maxDuration = 45

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const apiKey = getGeminiApiKey()

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Coach indisponível: GEMINI_API_KEY não configurada. Adicione a chave na Vercel em Settings → Environment Variables e faça redeploy.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const google = createGoogleGenerativeAI({ apiKey })

  const geminiModel = getGeminiModelId()
  if (!isValidGeminiModelId(geminiModel)) {
    return new Response(
      JSON.stringify({ error: formatInvalidGeminiModelMessage(geminiModel) }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const { messages }: { messages: UIMessage[] } = await req.json()

  console.log("[POST /api/chat] gemini", {
    model: geminiModel,
    keyFingerprint: `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`,
    vercel: Boolean(process.env.VERCEL),
  })

  const [healthContext, goals] = await Promise.all([
    getCoachHealthContext(),
    getUserNutritionGoals(),
  ])

  try {
    const result = streamText({
      model: google(geminiModel),
      system: buildCoachSystemPrompt(healthContext, goals),
      messages: await convertToModelMessages(messages),
      providerOptions: getCoachGoogleProviderOptions(),
      experimental_transform: getCoachSmoothStreamTransform(),
    })

    return result.toUIMessageStreamResponse({
      onError: (error) => formatGeminiErrorMessage(error, "coach"),
    })
  } catch (error) {
    console.error("[POST /api/chat]", error)
    const message = formatGeminiErrorMessage(error, "coach")

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
