import {
  extractErrorMessage,
  formatGeminiCreditsDepletedMessage,
  isGeminiCreditsDepleted,
  matchGeminiErrorMessage,
} from "@/lib/gemini-errors"

export type MealAnalysisItem = {
  nome: string
  qtd: number
  unidade: string
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
}

export type MealAnalysisResult = {
  items: MealAnalysisItem[]
  rawText: string
}

const MEAL_ANALYSIS_SYSTEM = `Você é um nutricionista que estima refeições para o app SYS.HEALTH.
Responda APENAS com JSON válido, sem markdown, no formato:
{"items":[{"nome":"string","qtd":number,"unidade":"g|ml|un","calorias":number,"proteinas":number,"carboidratos":number,"gorduras":number}]}
Regras:
- Português do Brasil nos nomes dos alimentos
- Estime porções realistas (gramas, ml ou unidades)
- Macros são totais da porção indicada em qtd+unidade
- Se não houver alimentos identificáveis, retorne {"items":[]}
- Não invente marcas; seja conservador nas calorias`

export function buildMealTextPrompt(text: string) {
  return `${MEAL_ANALYSIS_SYSTEM}

Descreva os alimentos e quantidades a partir do texto do usuário:
"""
${text.trim()}
"""`
}

export function buildMealPhotoPrompt() {
  return `${MEAL_ANALYSIS_SYSTEM}

Analise a foto do prato/refeição e liste cada alimento visível com porção estimada.`
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeItem(raw: unknown): MealAnalysisItem | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const nome = String(row.nome ?? row.name ?? "").trim()
  if (!nome) return null

  const qtd = asNumber(row.qtd ?? row.quantidade ?? row.grams ?? 100, 100)
  const unidade = String(row.unidade ?? row.unit ?? "g").trim() || "g"

  return {
    nome,
    qtd: qtd > 0 ? qtd : 1,
    unidade,
    calorias: Math.max(0, asNumber(row.calorias ?? row.kcal)),
    proteinas: Math.max(0, asNumber(row.proteinas ?? row.prot)),
    carboidratos: Math.max(0, asNumber(row.carboidratos ?? row.carb)),
    gorduras: Math.max(0, asNumber(row.gorduras ?? row.gord)),
  }
}

export function parseMealAnalysisResponse(rawText: string): MealAnalysisResult {
  const trimmed = rawText.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch?.[0] ?? trimmed

  try {
    const parsed = JSON.parse(candidate) as unknown
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>).items
        : []

    if (!Array.isArray(list)) {
      return { items: [], rawText: trimmed }
    }

    const items = list
      .map(normalizeItem)
      .filter((item): item is MealAnalysisItem => item != null)

    return { items, rawText: trimmed }
  } catch {
    return { items: [], rawText: trimmed }
  }
}

export function formatMealAnalysisError(error: unknown) {
  const message = extractErrorMessage(error)

  if (isGeminiCreditsDepleted(message)) {
    return formatGeminiCreditsDepletedMessage("meal")
  }

  const matched = matchGeminiErrorMessage(message)
  if (matched) return matched

  try {
    const parsed = JSON.parse(message) as { error?: string }
    if (parsed.error) {
      if (isGeminiCreditsDepleted(parsed.error)) {
        return formatGeminiCreditsDepletedMessage("meal")
      }
      const nested = matchGeminiErrorMessage(parsed.error)
      if (nested) return nested
      return parsed.error
    }
  } catch {
    // ignore
  }

  return message || "Não foi possível analisar a refeição."
}
