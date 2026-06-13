"use client"

import * as React from "react"

import { CoachReasoningBlock } from "@/components/ia-coach/coach-reasoning-block"
import { ChatMessageContent } from "@/components/ia-coach/chat-message-content"
import type { CoachMessagePart } from "@/lib/coach-chat-utils"

export function CoachAssistantContent({
  parts,
  isStreaming,
}: {
  parts: CoachMessagePart[]
  isStreaming: boolean
}) {
  const reasoningParts = parts.filter((part) => part.type === "reasoning")
  const textParts = parts.filter((part) => part.type === "text")
  const reasoningText = reasoningParts.map((part) => part.text ?? "").join("\n\n")
  const responseText = textParts.map((part) => part.text ?? "").join("")
  const reasoningStreaming = reasoningParts.some(
    (part) => part.state === "streaming"
  )
  const textStreaming =
    isStreaming && textParts.some((part) => part.state === "streaming")
  const hasResponseText = Boolean(responseText.trim())

  const [reasoningCollapsed, setReasoningCollapsed] = React.useState(false)

  React.useEffect(() => {
    if (hasResponseText && !reasoningStreaming) {
      setReasoningCollapsed(true)
    }
  }, [hasResponseText, reasoningStreaming])

  React.useEffect(() => {
    if (isStreaming && reasoningStreaming && !hasResponseText) {
      setReasoningCollapsed(false)
    }
  }, [isStreaming, reasoningStreaming, hasResponseText])

  return (
    <div className="flex flex-col gap-3">
      {reasoningText ? (
        <CoachReasoningBlock
          text={reasoningText}
          streaming={reasoningStreaming || (isStreaming && !hasResponseText)}
          collapsed={reasoningCollapsed}
          onToggle={() => setReasoningCollapsed((current) => !current)}
        />
      ) : null}

      {responseText ? (
        <ChatMessageContent text={responseText} isStreaming={textStreaming} />
      ) : null}
    </div>
  )
}
