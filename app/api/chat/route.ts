import { createGoogleGenerativeAI } from "@ai-sdk/google"
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai"

import { buildCoachSystemPrompt } from "@/lib/coach"
import { getCoachHealthContext } from "@/lib/data"
import {
  formatInvalidGeminiModelMessage,
  getGeminiModelId,
  isValidGeminiModelId,
} from "@/lib/gemini-model"
import { requireAuth } from "@/lib/supabase/auth"
import { getUserNutritionGoals } from "@/lib/user-settings"

export const maxDuration = 30

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Coach indisponível: GEMINI_API_KEY não configurada. Adicione a chave na Vercel em Settings → Environment Variables e faça redeploy.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const { messages }: { messages: UIMessage[] } = await req.json()

  const geminiModel = getGeminiModelId()
  if (!isValidGeminiModelId(geminiModel)) {
    return new Response(
      JSON.stringify({ error: formatInvalidGeminiModelMessage(geminiModel) }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const [healthContext, goals] = await Promise.all([
    getCoachHealthContext(),
    getUserNutritionGoals(),
  ])

  try {
    const result = streamText({
      model: google(geminiModel),
      system: buildCoachSystemPrompt(healthContext, goals),
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("[POST /api/chat]", error)
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível contactar o modelo Gemini."

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
