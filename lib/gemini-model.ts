const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"
const GEMINI_MODEL_PATTERN = /^gemini-[\w.-]+$/

export function normalizeGeminiModelId(raw: string | undefined | null) {
  const trimmed = raw?.trim() ?? ""
  if (!trimmed) return DEFAULT_GEMINI_MODEL

  const withoutPrefix = trimmed.startsWith("models/")
    ? trimmed.slice("models/".length)
    : trimmed

  return withoutPrefix.trim() || DEFAULT_GEMINI_MODEL
}

export function getGeminiModelId() {
  return normalizeGeminiModelId(process.env.GEMINI_MODEL)
}

export function isValidGeminiModelId(modelId: string) {
  return GEMINI_MODEL_PATTERN.test(modelId)
}

export function formatInvalidGeminiModelMessage(modelId: string) {
  return (
    `Modelo Gemini inválido (${modelId}). Use exatamente "gemini-2.5-flash" em GEMINI_MODEL ` +
    "(sem aspas) ou remova a variável para usar o padrão."
  )
}
