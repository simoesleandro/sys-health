import { formatGeminiErrorMessage } from "@/lib/gemini-errors"

export function formatCoachErrorMessage(error: Error | undefined) {
  if (!error) {
    return "Não foi possível obter resposta do Coach. Tente novamente."
  }

  return formatGeminiErrorMessage(error, "coach")
}
