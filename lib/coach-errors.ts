export function formatCoachErrorMessage(error: Error | undefined) {
  if (!error?.message) {
    return "Não foi possível obter resposta do Coach. Tente novamente."
  }

  const message = error.message

  if (
    message.includes("GEMINI_API_KEY") ||
    message.includes("GOOGLE_GENERATIVE_AI_API_KEY") ||
    message.includes("API key not valid") ||
    message.includes("API_KEY_INVALID")
  ) {
    return "Coach indisponível: configure GEMINI_API_KEY na Vercel (Settings → Environment Variables) e faça redeploy."
  }

  if (message.includes("429") || message.toLowerCase().includes("quota")) {
    return "Limite da API Gemini atingido. Aguarde alguns minutos e tente de novo."
  }

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
