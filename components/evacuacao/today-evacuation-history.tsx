import { SectionHeader } from "@/components/layout/section-header"
import { neutralHistoryCardClasses } from "@/lib/bristol-theme"
import type { EvacuationRecord } from "@/lib/evacuation"
import { cn } from "@/lib/utils"

export function TodayEvacuationHistory({
  records,
}: {
  records: EvacuationRecord[]
}) {
  return (
    <div className={cn(neutralHistoryCardClasses(), "p-5")}>
      <SectionHeader
        title="Histórico de hoje"
        subtitle="Registos em horário de Brasília"
      />

      <div className="mt-4">
        {records.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum registo intestinal hoje. Selecione um tipo acima para
            registar.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {records.map((record) => (
              <li
                key={record.id}
                className="flex flex-col gap-1 border-b border-zinc-800/60 pb-3 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-bold text-slate-300">
                    {record.horaLabel}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {record.tipoLabel}
                  </span>
                </div>
                {record.observacao ? (
                  <p className="text-xs text-slate-500 sm:max-w-[45%] sm:text-right">
                    {record.observacao}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
