export function isGeminiCreditsDepleted(message: string) {
  const lower = message.toLowerCase()
  return (
    lower.includes("prepayment credits are depleted") ||
    lower.includes("credits are depleted") ||
    (lower.includes("prepay") && lower.includes("billing"))
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
    "Os créditos pré-pagos da API Gemini acabaram. Recarregue em " +
    "https://aistudio.google.com → Configurações de faturamento." +
    manualHint
  )
}

export function matchGeminiErrorMessage(message: string) {
  if (isGeminiCreditsDepleted(message)) {
    return formatGeminiCreditsDepletedMessage("meal")
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

export function extractErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Erro desconhecido."
}
