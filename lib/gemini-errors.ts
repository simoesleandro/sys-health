type GeminiErrorLike = {
  message?: string
  cause?: unknown
  data?: unknown
  responseBody?: unknown
}

function collectErrorStrings(value: unknown, strings: string[], depth = 0) {
  if (depth > 4 || value == null) return

  if (typeof value === "string") {
    strings.push(value)
    return
  }

  if (value instanceof Error) {
    if (value.message) strings.push(value.message)
    collectErrorStrings(value.cause, strings, depth + 1)
    return
  }

  if (typeof value !== "object") return

  const record = value as GeminiErrorLike & Record<string, unknown>

  if (typeof record.message === "string") strings.push(record.message)
  if (typeof record.error === "string") strings.push(record.error)
  if (typeof record.responseBody === "string") strings.push(record.responseBody)

  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>
    if (typeof data.error === "string") strings.push(data.error)
    if (data.error && typeof data.error === "object") {
      const nested = data.error as Record<string, unknown>
      if (typeof nested.message === "string") strings.push(nested.message)
    }
  }

  try {
    strings.push(JSON.stringify(value))
  } catch {
    // ignore circular structures
  }

  collectErrorStrings(record.cause, strings, depth + 1)
}

export function extractGeminiErrorMessage(error: unknown) {
  const strings: string[] = []
  collectErrorStrings(error, strings)
  return strings.join(" | ")
}

export function isGeminiCreditsDepleted(message: string) {
  const lower = message.toLowerCase()
  return (
    lower.includes("prepayment credits are depleted") ||
    lower.includes("credits are depleted")
  )
}

export function isGeminiBillingRequired(message: string) {
  const lower = message.toLowerCase()
  return (
    lower.includes("billing account") ||
    lower.includes("billing is not enabled") ||
    lower.includes("enable billing") ||
    lower.includes("requires a paid") ||
    lower.includes("requires billing") ||
    (lower.includes("billing") && lower.includes("required"))
  )
}

export function formatGeminiCreditsDepletedMessage(
  context: "coach" | "meal" = "meal"
) {
  const manualHint =
    context === "meal"
      ? " Enquanto isso, use a aba Manual para registrar a refeição."
      : " Enquanto isso, use o restante do app normalmente."

  return (
    "A API Gemini retornou erro de créditos/faturamento. Se você vê saldo no AI Studio, " +
    "confira se a GEMINI_API_KEY na Vercel é a mesma chave ativa no projeto (Settings → API keys). " +
    "Recarregue em https://aistudio.google.com → Configurações de faturamento e faça redeploy." +
    manualHint
  )
}

export function formatGeminiBillingRequiredMessage(
  context: "coach" | "meal" = "meal"
) {
  const manualHint =
    context === "meal"
      ? " Enquanto isso, use a aba Manual."
      : " Enquanto isso, use o restante do app normalmente."

  return (
    "A chave Gemini precisa de faturamento ativo no Google Cloud / AI Studio para este modelo. " +
    "Ative billing em https://aistudio.google.com → Configurações de faturamento, " +
    "confirme que GEMINI_API_KEY na Vercel é a chave correta e redeploy." +
    manualHint
  )
}

export function matchGeminiErrorMessage(message: string) {
  if (isGeminiCreditsDepleted(message)) {
    return formatGeminiCreditsDepletedMessage("meal")
  }

  if (isGeminiBillingRequired(message)) {
    return formatGeminiBillingRequiredMessage("meal")
  }

  if (
    message.includes("GEMINI_API_KEY") ||
    message.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
    message.includes("API key not valid") ||
    message.includes("API_KEY_INVALID")
  ) {
    return "IA indisponível: configure GEMINI_API_KEY no ambiente (.env.local ou Vercel)."
  }

  if (message.includes("429") || message.toLowerCase().includes("quota")) {
    return "Limite da API Gemini atingido. Aguarde alguns minutos e tente de novo."
  }

  if (
    message.includes("unexpected model name format") ||
    message.includes("GenerateContentRequest.model")
  ) {
    return (
      'Modelo Gemini inválido. Configure GEMINI_MODEL como "gemini-2.5-flash" (sem aspas) ' +
      "ou remova a variável no .env.local / Vercel e faça redeploy."
    )
  }

  return null
}

export function formatGeminiErrorMessage(
  error: unknown,
  context: "coach" | "meal" = "meal"
) {
  const message = extractGeminiErrorMessage(error)

  if (!message) {
    return context === "coach"
      ? "Não foi possível obter resposta do Coach. Tente novamente."
      : "Não foi possível analisar a refeição."
  }

  if (isGeminiCreditsDepleted(message)) {
    return formatGeminiCreditsDepletedMessage(context)
  }

  if (isGeminiBillingRequired(message)) {
    return formatGeminiBillingRequiredMessage(context)
  }

  const matched = matchGeminiErrorMessage(message)
  if (matched) {
    return context === "coach"
      ? matched.replace("IA indisponível", "Coach indisponível")
      : matched
  }

  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return context === "coach"
      ? "Falha de rede ao contactar o Coach. Verifique a ligação e tente de novo."
      : "Falha de rede ao contactar a IA. Tente novamente."
  }

  try {
    const parsed = JSON.parse(message) as { error?: string }
    if (parsed.error) {
      return formatGeminiErrorMessage({ message: parsed.error }, context)
    }
  } catch {
    // not JSON
  }

  return message
}

export function extractErrorMessage(error: unknown) {
  const combined = extractGeminiErrorMessage(error)
  if (combined) return combined
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Erro desconhecido."
}
