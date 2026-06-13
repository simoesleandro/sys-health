function trimEnv(value: string | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

export function getGeminiApiKey() {
  return (
    trimEnv(process.env.GEMINI_API_KEY) ??
    trimEnv(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
  )
}

export function getGeminiApiKeyFingerprint(apiKey: string | null) {
  if (!apiKey) return "(vazio)"
  if (apiKey.length <= 10) return `(${apiKey.length} chars)`
  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)} (${apiKey.length} chars)`
}
