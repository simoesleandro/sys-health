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
      <DialogContent className="max-h-[85vh] overflow-hidden border-zinc-800 bg-zinc-950 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Histórico de evacuações</DialogTitle>
          <DialogDescription>
            {records.length > 0
              ? `${records.length} registro(s) em horário de Brasília`
              : "Nenhum registro ainda"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {records.length === 0 ? (
            <p className="text-sm leading-relaxed text-slate-500">
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
                  <ul className="divide-y divide-zinc-800/60 rounded-lg border border-zinc-800/50 bg-black/20">
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
