export type CoachMessagePart = {
  type: string
  text?: string
  state?: "streaming" | "done"
}

/** Mensagem serializável usada para pré-carregar o histórico no useChat. */
export type CoachInitialMessage = {
  id: string
  role: "user" | "assistant"
  parts: { type: "text"; text: string }[]
}

export function getMessageText(parts: CoachMessagePart[]) {
  return parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("")
}

export function getMessageReasoning(parts: CoachMessagePart[]) {
  return parts
    .filter((part) => part.type === "reasoning" && part.text)
    .map((part) => part.text)
    .join("\n\n")
}

export function hasAssistantStreamContent(parts: CoachMessagePart[]) {
  return parts.some(
    (part) =>
      (part.type === "text" || part.type === "reasoning") &&
      Boolean(part.text?.trim())
  )
}
