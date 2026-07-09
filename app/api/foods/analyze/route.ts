import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"

import {
  buildFoodAnalysisPrompt,
  formatFoodAnalysisError,
  parseFoodAnalysisResponse,
} from "@/lib/food-analysis"
import {
  formatInvalidGeminiModelMessage,
  getGeminiModelId,
  isValidGeminiModelId,
} from "@/lib/gemini-model"
import { getGeminiApiKey } from "@/lib/gemini-env"
import { requireAuth } from "@/lib/supabase/auth"

export const maxDuration = 60

type AnalyzeFoodBody = {
  descricao?: string
  qtdReferencia?: number
  unidadeReferencia?: string
}

export async function POST(req: Request) {
  const auth = await requireAuth()
  if (auth.error) {
    return Response.json({ error: auth.error }, { status: 401 })
  }

  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return Response.json(
      {
        error:
          "IA indisponivel: GEMINI_API_KEY nao configurada. Preencha os valores manualmente ou configure a chave.",
      },
      { status: 503 }
    )
  }

  let body: AnalyzeFoodBody
  try {
    body = (await req.json()) as AnalyzeFoodBody
  } catch {
    return Response.json({ error: "Corpo da requisicao invalido." }, { status: 400 })
  }

  const descricao = body.descricao?.trim() ?? ""
  if (descricao.length < 2) {
    return Response.json(
      { error: "Informe o nome do alimento antes de estimar." },
      { status: 400 }
    )
  }

  const geminiModel = getGeminiModelId()
  if (!isValidGeminiModelId(geminiModel)) {
    return Response.json(
      { error: formatInvalidGeminiModelMessage(geminiModel) },
      { status: 503 }
    )
  }

  const input = {
    descricao,
    qtdReferencia:
      Number.isFinite(body.qtdReferencia) && Number(body.qtdReferencia) > 0
        ? Number(body.qtdReferencia)
        : 100,
    unidadeReferencia: body.unidadeReferencia?.trim() || "g",
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey })
    const result = await generateText({
      model: google(geminiModel),
      prompt: buildFoodAnalysisPrompt(input),
    })

    const parsed = parseFoodAnalysisResponse(result.text, input)
    if (!parsed) {
      return Response.json(
        {
          error:
            "A IA nao retornou uma estimativa utilizavel. Tente detalhar melhor o alimento.",
        },
        { status: 422 }
      )
    }

    return Response.json({
      food: parsed.food,
      raw: parsed.rawText,
    })
  } catch (error) {
    console.error("[POST /api/foods/analyze]", error)
    return Response.json(
      { error: formatFoodAnalysisError(error) },
      { status: 500 }
    )
  }
}
