"use client"

import * as React from "react"
import { Brain, Check, Copy } from "lucide-react"

import { CoachAssistantContent } from "@/components/ia-coach/coach-assistant-content"
import { getMessageText, type CoachMessagePart } from "@/lib/coach-chat-utils"
import { cn } from "@/lib/utils"

type CoachMessageProps = {
  role: "user" | "assistant" | "system"
  parts: CoachMessagePart[]
  isStreaming?: boolean
}

function CoachMessageComponent({
  role,
  parts,
  isStreaming = false,
}: CoachMessageProps) {
  const isUser = role === "user"
  const messageText = getMessageText(parts).trim()
  const canCopy = !isUser && !isStreaming && Boolean(messageText)
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return

    const timeoutId = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  async function copyMessage() {
    if (!canCopy) return

    try {
      await navigator.clipboard.writeText(messageText)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (isUser) {
    return (
      <div className="flex w-full justify-end [content-visibility:auto]">
        <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {getMessageText(parts)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full justify-start gap-3 [content-visibility:auto]">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800/60 bg-black/40 text-brand-cyan">
        <Brain className="size-4" />
      </div>
      <div
        className={cn(
          "relative min-w-0 max-w-[90%] rounded-2xl px-4 py-3",
          canCopy ? "pr-11" : null,
          "bg-muted/30 text-foreground"
        )}
      >
        {canCopy ? (
          <button
            type="button"
            title={copied ? "Copiado" : "Copiar resposta"}
            aria-label={copied ? "Resposta copiada" : "Copiar resposta"}
            onClick={copyMessage}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        ) : null}
        <CoachAssistantContent parts={parts} isStreaming={isStreaming} />
      </div>
    </div>
  )
}

export const CoachMessage = React.memo(CoachMessageComponent)
