"use client"

import * as React from "react"
import { Brain, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export function CoachReasoningBlock({
  text,
  streaming,
  collapsed,
  onToggle,
}: {
  text: string
  streaming: boolean
  collapsed: boolean
  onToggle: () => void
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!streaming || collapsed) return
    const node = scrollRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [text, streaming, collapsed])

  if (!text.trim()) return null

  return (
    <div className="rounded-lg border border-brand-cyan/20 bg-brand-cyan/5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-brand-cyan">
          <Brain className="size-3.5" />
          {streaming ? "Pensando…" : "Raciocínio"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-500 transition-transform",
            collapsed && "-rotate-90"
          )}
        />
      </button>

      {!collapsed ? (
        <div
          ref={scrollRef}
          className="max-h-48 overflow-y-auto border-t border-brand-cyan/15 px-3 py-2"
        >
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
            {text}
            {streaming ? (
              <span className="ml-0.5 inline-block animate-pulse text-brand-cyan">
                ▍
              </span>
            ) : null}
          </p>
        </div>
      ) : null}
    </div>
  )
}
