import { Brain } from "lucide-react"

import { ChatMessageContent } from "@/components/ia-coach/chat-message-content"
import { Badge } from "@/components/ui/badge"
import { NeonCard } from "@/components/ui/neon-card"
import {
  formatIaAnalysisKindLabel,
  formatMealItemsSummary,
  type IaHistoryEntry,
} from "@/lib/ia-analyses"
import { getIaAnalysesHistory } from "@/lib/data"
import { cn } from "@/lib/utils"

function kindBadgeClass(kind: IaHistoryEntry["kind"]) {
  switch (kind) {
    case "coach":
      return "border-brand-cyan/30 bg-brand-cyan/15 text-brand-cyan"
    case "meal-text":
      return "border-orange-500/30 bg-orange-500/15 text-orange-400"
    case "meal-photo":
      return "border-brand-magenta/30 bg-brand-magenta/15 text-brand-magenta"
  }
}

function IaAnalysisCard({
  entry,
  highlight,
}: {
  entry: IaHistoryEntry
  highlight: boolean
}) {
  const isCoach = entry.kind === "coach"

  return (
    <article
      className={cn(
        "rounded-lg border px-4 py-4",
        highlight
          ? "border-brand-cyan/40 bg-brand-cyan/5"
          : "border-zinc-800/50 bg-black/20"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={kindBadgeClass(entry.kind)}>
          {formatIaAnalysisKindLabel(entry.kind)}
        </Badge>
        <span className="text-xs text-slate-500">{entry.createdLabel}</span>
      </div>

      {entry.entrada ? (
        <div className="mt-3">
          <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
            {isCoach ? "Pergunta" : "Entrada"}
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap text-slate-300">
            {entry.entrada}
          </p>
        </div>
      ) : null}

      <div className="mt-3">
        <p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">
          {isCoach ? "Resposta" : "Itens identificados"}
        </p>
        {isCoach ? (
          <div className="mt-2 rounded-lg border border-zinc-800/50 bg-zinc-950/40 px-3 py-3">
            <ChatMessageContent text={entry.resposta} />
          </div>
        ) : entry.mealItems.length > 0 ? (
          <p className="mt-1 text-sm text-slate-300">
            {formatMealItemsSummary(entry.mealItems)}
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">
            Nenhum alimento identificado nesta análise.
          </p>
        )}
      </div>
    </article>
  )
}

export async function HistoryIaAnalyses({
  selectedDate,
}: {
  selectedDate: string
}) {
  const analyses = await getIaAnalysesHistory()
  const dayCount = analyses.filter((entry) => entry.brtDate === selectedDate).length

  return (
    <section className="mt-6">
      <NeonCard accent="cyan" className="p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800/60 bg-black/40 text-brand-cyan">
            <Brain className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Análises da IA</h2>
            <p className="mt-1 text-xs text-slate-500">
              {analyses.length} análise(s) no total
              {dayCount > 0 ? ` · ${dayCount} no dia selecionado` : ""}
            </p>
          </div>
        </div>

        {analyses.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma análise registrada ainda. Converse com o IA Coach ou analise
            uma refeição para começar o histórico.
          </p>
        ) : (
          <div className="flex max-h-[720px] flex-col gap-3 overflow-y-auto pr-1">
            {analyses.map((entry) => (
              <IaAnalysisCard
                key={entry.id}
                entry={entry}
                highlight={entry.brtDate === selectedDate}
              />
            ))}
          </div>
        )}
      </NeonCard>
    </section>
  )
}
