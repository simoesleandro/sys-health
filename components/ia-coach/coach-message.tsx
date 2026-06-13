"use client"

import * as React from "react"
import { Brain } from "lucide-react"

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
          "min-w-0 max-w-[90%] rounded-2xl px-4 py-3",
          "bg-muted/30 text-foreground"
        )}
      >
        <CoachAssistantContent parts={parts} isStreaming={isStreaming} />
      </div>
    </div>
  )
}

export const CoachMessage = React.memo(CoachMessageComponent)
