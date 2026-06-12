import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"

import {
  buildMealPhotoPrompt,
  buildMealTextPrompt,
  formatMealAnalysisError,
  parseMealAnalysisResponse,
} from "@/lib/meal-analysis"
import {
  formatInvalidGeminiModelMessage,
  getGeminiModelId,
  isValidGeminiModelId,
} from "@/lib/gemini-model"
import { requireAuth } from "@/lib/supabase/auth"

export const maxDuration = 60

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})

type AnalyzeBody =
  | { mode: "text"; text: string }
  | {
      mode: "photo"
      imageBase64: string
      mimeType: string
      fileName?: string
    }

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: 401 })
  }

  const apiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY

  if (!apiKey) {
    return Response.json(
      {
        error:
          "Análise IA indisponível: GEMINI_API_KEY não configurada. Adicione a chave no ambiente e reinicie o servidor.",
      },
      { status: 503 }
    )
  }

  let body: AnalyzeBody
  try {
    body = (await req.json()) as AnalyzeBody
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }

  const geminiModel = getGeminiModelId()
  if (!isValidGeminiModelId(geminiModel)) {
    return Response.json(
      { error: formatInvalidGeminiModelMessage(geminiModel) },
      { status: 503 }
    )
  }

  try {
    if (body.mode === "text") {
      const text = body.text?.trim() ?? ""
      if (text.length < 3) {
        return Response.json(
          { error: "Descreva a refeição com pelo menos 3 caracteres." },
          { status: 400 }
        )
      }

      const result = await generateText({
        model: google(geminiModel),
        prompt: buildMealTextPrompt(text),
      })

      const parsed = parseMealAnalysisResponse(result.text)
      if (!parsed.items.length) {
        return Response.json(
          {
            error:
              "A IA não identificou alimentos. Tente ser mais específico (ex.: 2 ovos, 150g arroz, salada).",
          },
          { status: 422 }
        )
      }

      return Response.json({
        items: parsed.items,
        raw: parsed.rawText,
        mode: "text" as const,
      })
    }

    if (body.mode === "photo") {
      const mimeType = body.mimeType?.trim() || "image/jpeg"
      const base64 = body.imageBase64?.trim() ?? ""

      if (!base64) {
        return Response.json({ error: "Envie uma imagem válida." }, { status: 400 })
      }

      const bytes = Math.ceil((base64.length * 3) / 4)
      if (bytes > MAX_IMAGE_BYTES) {
        return Response.json(
          { error: "Imagem muito grande. Use uma foto de até 5 MB." },
          { status: 400 }
        )
      }

      const result = await generateText({
        model: google(geminiModel),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: buildMealPhotoPrompt() },
              {
                type: "image",
                image: `data:${mimeType};base64,${base64}`,
              },
            ],
          },
        ],
      })

      const parsed = parseMealAnalysisResponse(result.text)
      if (!parsed.items.length) {
        return Response.json(
          {
            error:
              "Não foi possível identificar alimentos na foto. Tente outra imagem com melhor iluminação.",
          },
          { status: 422 }
        )
      }

      return Response.json({
        items: parsed.items,
        raw: parsed.rawText,
        mode: "photo" as const,
        fileName: body.fileName ?? null,
      })
    }

    return Response.json({ error: "Modo de análise inválido." }, { status: 400 })
  } catch (error) {
    console.error("[POST /api/meals/analyze]", error)
    return Response.json(
      { error: formatMealAnalysisError(error) },
      { status: 500 }
    )
  }
}
