import {
  FOOD_REFERENCE_UNITS,
  type FoodFormInput,
  type FoodReferenceUnit,
} from "@/lib/foods"
import { formatGeminiErrorMessage } from "@/lib/gemini-errors"

export type FoodAnalysisInput = {
  descricao: string
  qtdReferencia: number
  unidadeReferencia: string
}

export type FoodAnalysisResult = {
  food: FoodFormInput
  rawText: string
}

const FOOD_ANALYSIS_SYSTEM = `Voce e um nutricionista que estima alimentos para o app SYS.HEALTH.
Responda APENAS com JSON valido, sem markdown, no formato:
{"descricao":"string","categoria":"string","qtdReferencia":number,"unidadeReferencia":"g|ml|und","calorias":number,"proteinas":number,"carboidratos":number,"gorduras":number}
Regras:
- Portugues do Brasil nos nomes dos alimentos
- Valores nutricionais referentes exatamente a qtdReferencia + unidadeReferencia
- Use g para solidos, ml para liquidos e und apenas quando a unidade fizer sentido
- Categoria curta e util para busca pessoal (ex.: Proteina, Carboidrato, Fruta, Laticinio, Combo, Lanche)
- Nao invente marcas; se o usuario citar marca, preserve no nome e estime de forma conservadora
- Se a porcao nao estiver clara, use a porcao informada pelo app`

export function buildFoodAnalysisPrompt(input: FoodAnalysisInput) {
  const descricao = input.descricao.trim()
  const qtdReferencia =
    Number.isFinite(input.qtdReferencia) && input.qtdReferencia > 0
      ? input.qtdReferencia
      : 100
  const unidadeReferencia = normalizeReferenceUnit(input.unidadeReferencia)

  return `${FOOD_ANALYSIS_SYSTEM}

Alimento informado pelo usuario:
"""
${descricao}
"""

Porcao de referencia desejada:
${qtdReferencia}${unidadeReferencia}`
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeReferenceUnit(value: unknown): FoodReferenceUnit {
  const unit = String(value ?? "g").trim().toLowerCase()
  if (FOOD_REFERENCE_UNITS.includes(unit as FoodReferenceUnit)) {
    return unit as FoodReferenceUnit
  }
  if (unit === "un" || unit === "unidade" || unit === "unidades") return "und"
  return "g"
}

export function parseFoodAnalysisResponse(
  rawText: string,
  fallback: FoodAnalysisInput
): FoodAnalysisResult | null {
  const trimmed = rawText.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch?.[0] ?? trimmed

  try {
    const parsed = JSON.parse(candidate) as unknown
    if (!parsed || typeof parsed !== "object") return null

    const row = parsed as Record<string, unknown>
    const descricao = String(row.descricao ?? row.nome ?? fallback.descricao)
      .trim()
    if (descricao.length < 2) return null

    const qtdReferencia = asNumber(
      row.qtdReferencia ?? row.qtd_referencia ?? row.qtd,
      fallback.qtdReferencia
    )

    const food: FoodFormInput = {
      descricao,
      categoria: String(row.categoria ?? "Lanche").trim() || "Lanche",
      calorias: Math.max(0, asNumber(row.calorias ?? row.kcal)),
      proteinas: Math.max(0, asNumber(row.proteinas ?? row.prot)),
      carboidratos: Math.max(0, asNumber(row.carboidratos ?? row.carb)),
      gorduras: Math.max(0, asNumber(row.gorduras ?? row.gord)),
      qtdReferencia: qtdReferencia > 0 ? qtdReferencia : fallback.qtdReferencia,
      unidadeReferencia: normalizeReferenceUnit(
        row.unidadeReferencia ?? row.unidade_referencia ?? row.unidade
      ),
    }

    return { food, rawText: trimmed }
  } catch {
    return null
  }
}

export function formatFoodAnalysisError(error: unknown) {
  return formatGeminiErrorMessage(error, "meal")
}
