"use client"

import * as React from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { Eraser, History, Loader2, Send, Square } from "lucide-react"

import { CoachMessage } from "@/components/ia-coach/coach-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { logCoachAnalysis } from "@/lib/actions/coach-analysis"
import {
  getMessageText,
  hasAssistantStreamContent,
  type CoachInitialMessage,
  type CoachMessagePart,
} from "@/lib/coach-chat-utils"
import { formatCoachErrorMessage } from "@/lib/coach-errors"
import { cn } from "@/lib/utils"

const QUICK_PROMPTS = [
  {
    label: "Analisar meu dia",
    prompt:
      "Analise meu dia de hoje e me diga o que mais impacta minha energia, fome e recuperação.",
  },
  {
    label: "Ajustar amanhã",
    prompt:
      "Com base nos meus dados recentes, sugira ajustes simples para melhorar meu dia de amanhã.",
  },
  {
    label: "Nutrição agora",
    prompt:
      "Olhe minha alimentação recente e sugira a próxima refeição com foco nos meus macros.",
  },
  {
    label: "Sono e treino",
    prompt:
      "Compare meu sono, recuperação e treino recente e indique o melhor foco para hoje.",
  },
] as const

export function ChatInterface({
  className,
  initialMessages = [],
}: {
  className?: string
  initialMessages?: CoachInitialMessage[]
}) {
  const [input, setInput] = React.useState("")
  const scrollRef = React.useRef<HTMLDivElement>(null)
  // Pares já persistidos (histórico recarregado) não devem ser re-gravados.
  const loggedAssistantIds = React.useRef(
    new Set<string>(
      initialMessages
        .filter((message) => message.role === "assistant")
        .map((message) => message.id)
    )
  )

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
    clearError,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: initialMessages as unknown as UIMessage[],
  })

  const isBusy = status === "submitted" || status === "streaming"
  const errorMessage = formatCoachErrorMessage(error)
  const hasSavedHistory = initialMessages.length > 0
  const canRestoreHistory = hasSavedHistory && messages.length === 0

  const lastMessage = messages.at(-1)
  const awaitingFirstToken =
    isBusy &&
    (status === "submitted" ||
      (lastMessage?.role === "assistant" &&
        !hasAssistantStreamContent(
          (lastMessage.parts ?? []) as CoachMessagePart[]
        )))

  React.useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [messages, status, awaitingFirstToken])

  React.useEffect(() => {
    if (isBusy || messages.length < 2) return

    const last = messages[messages.length - 1]
    const previous = messages[messages.length - 2]
    if (last.role !== "assistant" || previous.role !== "user") return
    if (loggedAssistantIds.current.has(last.id)) return

    const pergunta = getMessageText(previous.parts as CoachMessagePart[]).trim()
    const resposta = getMessageText(last.parts as CoachMessagePart[]).trim()
    if (!pergunta || !resposta) return

    loggedAssistantIds.current.add(last.id)
    void logCoachAnalysis({ pergunta, resposta })
  }, [isBusy, messages])

  function sendCoachMessage(text: string) {
    const trimmedText = text.trim()
    if (!trimmedText || isBusy) return

    clearError()
    sendMessage({ text: trimmedText })
    setInput("")
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    sendCoachMessage(input)
  }

  function handleHistoryToggle() {
    if (isBusy) return

    clearError()
    setInput("")

    if (canRestoreHistory) {
      setMessages(initialMessages as unknown as UIMessage[])
      return
    }

    if (messages.length > 0) {
      setMessages([])
    }
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
          messages.map((message, index) => {
            const isLastAssistant =
              index === messages.length - 1 && message.role === "assistant"
            const isStreamingMessage =
              isLastAssistant && status === "streaming"

            return (
              <CoachMessage
                key={message.id}
                role={message.role}
                parts={(message.parts ?? []) as CoachMessagePart[]}
                isStreaming={isStreamingMessage}
              />
            )
          })
        )}

        {awaitingFirstToken ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            A preparar contexto…
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2.5 text-sm text-red-200"
            role="alert"
          >
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-border px-4 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isBusy || (!hasSavedHistory && messages.length === 0)}
          onClick={handleHistoryToggle}
          title={canRestoreHistory ? "Ver histórico" : "Nova conversa"}
          className="h-8 shrink-0 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          {canRestoreHistory ? (
            <History className="size-3.5" />
          ) : (
            <Eraser className="size-3.5" />
          )}
          <span className="hidden sm:inline">
            {canRestoreHistory ? "Ver histórico" : "Nova conversa"}
          </span>
        </Button>

        {QUICK_PROMPTS.map((quickPrompt) => (
          <Button
            key={quickPrompt.label}
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => sendCoachMessage(quickPrompt.prompt)}
            className="h-8 shrink-0 rounded-full border-border/80 bg-background/70 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {quickPrompt.label}
          </Button>
        ))}
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
        <Button
          type={isBusy ? "button" : "submit"}
          size="icon"
          disabled={!isBusy && !input.trim()}
          onClick={isBusy ? stop : undefined}
        >
          {isBusy ? (
            <Square className="size-3.5 fill-current" />
          ) : (
            <Send className="size-4" />
          )}
          <span className="sr-only">
            {isBusy ? "Parar resposta" : "Enviar"}
          </span>
        </Button>
      </form>
    </div>
  )
}
