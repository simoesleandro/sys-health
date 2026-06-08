"use client"

import { Line, LineChart, ResponsiveContainer } from "recharts"

import { NEON_ACCENTS } from "@/lib/neon-theme"
import type { TrendMetricData } from "@/lib/trends"
import { cn } from "@/lib/utils"

const ACCENT_TOP_BORDER: Record<TrendMetricData["accent"], string> = {
  cyan: "border-t-cyan-500/50",
  blue: "border-t-blue-500/50",
  magenta: "border-t-fuchsia-500/50",
  purple: "border-t-purple-500/50",
  green: "border-t-emerald-500/50",
  orange: "border-t-orange-500/50",
}

function formatDelta(delta: number) {
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta.toFixed(1)}%`
}

function trendSentiment(metric: TrendMetricData) {
  if (Math.abs(metric.deltaPct) < 0.5) return "neutral" as const
  const improved = metric.higherIsBetter
    ? metric.deltaPct > 0
    : metric.deltaPct < 0
  return improved ? ("positive" as const) : ("negative" as const)
}

export function TrendCard({ metric }: { metric: TrendMetricData }) {
  const styles = NEON_ACCENTS[metric.accent]
  const sentiment = trendSentiment(metric)
  const chartColor = styles.chart
  const isUp = metric.deltaPct >= 0

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-zinc-800/50 backdrop-blur-md",
        styles.surface,
        ACCENT_TOP_BORDER[metric.accent],
        styles.atmosphere,
        "px-3.5 py-3"
      )}
    >
      <p className="neon-label text-[9px]">{metric.title}</p>

      <div className="mt-2 flex items-center gap-2">
        <p className="text-2xl font-bold tracking-tight text-white">
          {metric.formattedValue}
          {metric.unit ? (
            <span className="ml-1 text-sm font-medium text-slate-500">
              {metric.unit}
            </span>
          ) : null}
        </p>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums",
            sentiment === "positive" &&
              "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
            sentiment === "negative" &&
              "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-400",
            sentiment === "neutral" &&
              "border-zinc-700/50 bg-zinc-800/40 text-slate-400"
          )}
        >
          <span aria-hidden>{isUp ? "▲" : "▼"}</span>
          {formatDelta(metric.deltaPct)}
        </span>
      </div>

      <div className="mt-3 h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metric.sparkline}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
