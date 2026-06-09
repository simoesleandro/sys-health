import { createGoogleGenerativeAI } from "@ai-sdk/google"
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai"

import { buildCoachSystemPrompt } from "@/lib/coach"
import { getCoachHealthContext } from "@/lib/data"

export const maxDuration = 30

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-2.5-flash"

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

export async function POST(req: Request) {
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

  const healthContext = await getCoachHealthContext()

  try {
    const result = streamText({
      model: google(GEMINI_MODEL),
      system: buildCoachSystemPrompt(healthContext),
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
