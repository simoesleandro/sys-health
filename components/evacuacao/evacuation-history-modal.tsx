"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { parseDataHoraUtcMs } from "@/lib/brt-time"
import type { EvacuationRecord } from "@/lib/evacuation"

function getBrtDateKey(dataHora: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(parseDataHoraUtcMs(dataHora)))
}

function formatGroupDateLabel(dataHora: string, todayKey: string) {
  const key = getBrtDateKey(dataHora)
  if (key === todayKey) return "Hoje"

  const ms = parseDataHoraUtcMs(dataHora)
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(ms))
}

function groupRecordsByDate(records: EvacuationRecord[]) {
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date())

  const groups = new Map<string, EvacuationRecord[]>()

  for (const record of records) {
    const key = getBrtDateKey(record.dataHora)
    const existing = groups.get(key) ?? []
    existing.push(record)
    groups.set(key, existing)
  }

  return Array.from(groups.entries()).map(([dateKey, items]) => ({
    dateKey,
    label: formatGroupDateLabel(items[0]!.dataHora, todayKey),
    records: items,
  }))
}

export function EvacuationHistoryModal({
  open,
  onOpenChange,
  records,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  records: EvacuationRecord[]
}) {
  const groups = React.useMemo(() => groupRecordsByDate(records), [records])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-x-3 top-[4dvh] flex max-h-[88dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-brand-green/25 bg-zinc-950 p-0 shadow-2xl shadow-brand-green/10 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[82vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-brand-green/20 bg-gradient-to-br from-emerald-950/45 via-zinc-950 to-cyan-950/25 px-4 py-3">
          <DialogTitle className="text-white">Histórico de evacuações</DialogTitle>
          <DialogDescription className="text-slate-300">
            {records.length > 0
              ? `${records.length} registro(s) em horário de Brasília`
              : "Nenhum registro ainda"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-emerald-950/20 px-4 py-4">
          {records.length === 0 ? (
            <p className="rounded-lg border border-dashed border-brand-green/25 bg-brand-green/5 px-3 py-4 text-sm leading-relaxed text-slate-400">
              Ainda não há registros. Use o botão{" "}
              <span className="font-medium text-slate-300">Registrar</span> na
              página para adicionar o primeiro.
            </p>
          ) : (
            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.dateKey}>
                  <h3 className="mb-2 text-xs font-bold tracking-[0.14em] text-brand-cyan uppercase">
                    {group.label}
                  </h3>
                  <ul className="divide-y divide-white/10 rounded-lg border border-white/10 bg-black/20">
                    {group.records.map((record) => (
                      <li
                        key={record.id}
                        className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="flex min-w-0 items-baseline gap-2">
                          <span className="shrink-0 font-mono text-sm font-bold text-slate-300">
                            {record.horaLabel}
                          </span>
                          <span className="truncate text-sm font-medium text-white">
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
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
