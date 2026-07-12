"use client"

import {
  deltaSentiment,
  type BodyCompositionDelta,
  type BodyCompositionDeltasResult,
} from "@/lib/body-composition-shared"
import { neonCardClasses } from "@/lib/neon-theme"
import { cn } from "@/lib/utils"

function formatMetricValue(value: number, decimals: number, unit: string) {
  const formatted = value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${formatted} ${unit}`
}

function formatDeltaValue(delta: number, decimals: number, unit: string) {
  const sign = delta > 0 ? "+" : ""
  const formatted = delta.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${sign}${formatted} ${unit}`
}

function DeltaBadge({ row }: { row: BodyCompositionDelta }) {
  if (row.delta == null) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border border-zinc-700/50 bg-zinc-800/40 px-2 py-0.5 text-[10px] font-medium text-slate-500">
        —
      </span>
    )
  }

  const sentiment = deltaSentiment(row)
  const isUp = row.delta > 0

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums",
        sentiment === "positive" &&
          "border-cyan-500/25 bg-cyan-500/10 text-cyan-400",
        sentiment === "negative" &&
          "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-400",
        sentiment === "neutral" &&
          "border-zinc-700/50 bg-zinc-800/40 text-slate-400"
      )}
    >
      <span aria-hidden>{isUp ? "▲" : "▼"}</span>
      {formatDeltaValue(row.delta, row.decimals, row.unit)}
    </span>
  )
}

export function BodyCompositionTable({
  data,
}: {
  data: BodyCompositionDeltasResult
}) {
  return (
    <div className={cn(neonCardClasses("blue"), "flex h-full flex-col px-5 py-5")}>
      <div className="mb-4">
        <h3 className="neon-section-title">
          Composição corporal e medidas
        </h3>
        <p className="neon-section-subtitle mt-1">
          Última medição · {data.dataLabel}
        </p>
      </div>

      {data.rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Nenhuma medida registrada ainda.
        </p>
      ) : (
        <ul className="flex flex-1 flex-col divide-y divide-zinc-800/60">
          {data.rows.map((row) => (
            <li
              key={row.metricId}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  {row.metrica}
                </p>
                <p className="text-base font-bold tabular-nums text-white">
                  {formatMetricValue(row.atual, row.decimals, row.unit)}
                </p>
              </div>
              <DeltaBadge row={row} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
