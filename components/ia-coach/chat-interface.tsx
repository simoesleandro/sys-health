"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Loader2, Send } from "lucide-react"

import { ChatMessageContent } from "@/components/ia-coach/chat-message-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function getMessageText(parts: { type: string; text?: string }[]) {
  return parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("")
}

export function ChatInterface({ className }: { className?: string }) {
  const [input, setInput] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const isBusy = status === "submitted" || status === "streaming"

  React.useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, status])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isBusy) return

    sendMessage({ text })
    setInput("")
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">SYS.HEALTH Coach</p>
            <p>
              Pergunte sobre nutrição, sono, HRV ou recuperação com base nos
              seus dados de hoje.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const text = getMessageText(message.parts)
            const isUser = message.role === "user"

            return (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-muted/40 text-foreground"
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {text}
                    </p>
                  ) : (
                    <ChatMessageContent text={text} />
                  )}
                </div>
              </div>
            )
          })
        )}

        {isBusy ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            O Coach está a pensar…
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error.message ||
              "Não foi possível obter resposta do Coach. Tente novamente."}
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-3"
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Pergunte ao Coach…"
          disabled={isBusy}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isBusy || !input.trim()}>
          <Send className="size-4" />
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  )
}
