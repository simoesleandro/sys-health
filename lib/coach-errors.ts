import {
  formatGeminiCreditsDepletedMessage,
  isGeminiCreditsDepleted,
  matchGeminiErrorMessage,
} from "@/lib/gemini-errors"

export function formatCoachErrorMessage(error: Error | undefined) {
  if (!error?.message) {
    return "Não foi possível obter resposta do Coach. Tente novamente."
  }

  const message = error.message

  if (isGeminiCreditsDepleted(message)) {
    return formatGeminiCreditsDepletedMessage("coach")
  }

  const matched = matchGeminiErrorMessage(message)
  if (matched) return matched.replace("IA indisponível", "Coach indisponível")

  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "Falha de rede ao contactar o Coach. Verifique a ligação e tente novamente."
  }

  try {
    const parsed = JSON.parse(message) as { error?: string }
    if (parsed.error) return parsed.error
  } catch {
    // not JSON — use raw message below
  }

  return message
}
