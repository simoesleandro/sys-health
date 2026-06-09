"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import { BodyCompositionTable } from "@/components/evolucao/body-composition-table"
import { MacroBars } from "@/components/dashboard/macro-bars"
import { NeonCard } from "@/components/ui/neon-card"
import type { BodyCompositionDeltasResult } from "@/lib/body-composition-shared"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type {
  TodayNutritionTotals,
  WeightHistoryPoint,
  WeightHistoryStart,
  WearableTrendPoint,
} from "@/lib/data"
import type { NutritionGoals } from "@/lib/goals"
import { NEON_ACCENTS, type NeonAccent } from "@/lib/neon-theme"
import { cn } from "@/lib/utils"

const weightChartConfig = {
  peso: { label: "Peso (kg)", color: NEON_ACCENTS.blue.chart },
} satisfies ChartConfig

const hrvChartConfig = {
  hrv: { label: "HRV (ms)", color: NEON_ACCENTS.cyan.chart },
} satisfies ChartConfig

const sleepChartConfig = {
  sonoHoras: { label: "Sono (h)", color: NEON_ACCENTS.purple.chart },
} satisfies ChartConfig

const chartAxisTick = { fill: "#64748b", fontSize: 11 }

function ChartCard({
  title,
  subtitle,
  accent,
  children,
  className,
}: {
  title: string
  subtitle: string
  accent: NeonAccent
  children: React.ReactNode
  className?: string
}) {
  return (
    <NeonCard accent={accent} className={cn("px-5 py-5", className)}>
      <div className="mb-5">
        <h3 className="neon-section-title">{title}</h3>
        <p className="neon-section-subtitle mt-1">{subtitle}</p>
      </div>
      {children}
    </NeonCard>
  )
}

export function EvolutionCharts({
  weightData,
  weightStart,
  wearableData,
  bodyComposition,
  macros,
  goals,
}: {
  weightData: WeightHistoryPoint[]
  weightStart: WeightHistoryStart | null
  wearableData: WearableTrendPoint[]
  bodyComposition: BodyCompositionDeltasResult
  macros: Pick<TodayNutritionTotals, "proteinas" | "carboidratos" | "gorduras">
  goals: NutritionGoals
}) {
  const hasWeight = weightData.some((point) => point.peso != null)
  const hasHrv = wearableData.some((point) => point.hrv != null && point.hrv > 0)
  const hasSleep = wearableData.some(
    (point) => point.sonoHoras != null && point.sonoHoras > 0
  )

  const startOverlay =
    weightStart != null
      ? `Início ${weightStart.peso.toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })} kg — ${weightStart.label}`
      : null

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Peso"
          subtitle="Histórico real (medidas)"
          accent="blue"
        >
          {hasWeight ? (
            <div className="relative">
              {startOverlay ? (
                <p className="absolute top-0 right-0 z-10 text-[11px] font-medium text-brand-cyan">
                  {startOverlay}
                </p>
              ) : null}
              <ChartContainer
                config={weightChartConfig}
                className="h-[240px] w-full"
              >
                <LineChart data={weightData} accessibilityLayer>
                  <CartesianGrid
                    vertical={false}
                    stroke="rgb(255 255 255 / 5%)"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={20}
                    tick={chartAxisTick}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={["auto", "auto"]}
                    tick={chartAxisTick}
                    width={40}
                    tickFormatter={(v) =>
                      Number(v).toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })
                    }
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="linear"
                    dataKey="peso"
                    stroke={NEON_ACCENTS.blue.chart}
                    strokeWidth={1.5}
                    dot={{
                      r: 2.5,
                      fill: "#000000",
                      stroke: NEON_ACCENTS.blue.chart,
                      strokeWidth: 1.5,
                    }}
                    activeDot={{ r: 3.5 }}
                    connectNulls
                  />
                </LineChart>
              </ChartContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-zinc-500">
              Sem registos de peso no período.
            </p>
          )}
        </ChartCard>

        <BodyCompositionTable data={bodyComposition} />
      </div>

      <ChartCard title="Macronutrientes" subtitle="Hoje" accent="cyan">
        <MacroBars
          proteinas={macros.proteinas}
          carboidratos={macros.carboidratos}
          gorduras={macros.gorduras}
          goals={goals}
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Sono" subtitle="Horas por noite (Amazfit)" accent="purple">
          {hasSleep ? (
            <ChartContainer config={sleepChartConfig} className="h-[220px] w-full">
              <AreaChart data={wearableData} accessibilityLayer>
                <CartesianGrid
                  vertical={false}
                  stroke="rgb(255 255 255 / 5%)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={20}
                  tick={chartAxisTick}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={chartAxisTick}
                  width={32}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="linear"
                  dataKey="sonoHoras"
                  stroke={NEON_ACCENTS.purple.chart}
                  fill={NEON_ACCENTS.purple.chart}
                  fillOpacity={0.06}
                  strokeWidth={1.5}
                  connectNulls
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="py-12 text-center text-sm text-zinc-500">
              Sem dados de sono nos últimos 14 dias.
            </p>
          )}
        </ChartCard>

        <ChartCard title="HRV" subtitle="Tendência diária (Amazfit)" accent="cyan">
          {hasHrv ? (
            <ChartContainer config={hrvChartConfig} className="h-[220px] w-full">
              <AreaChart data={wearableData} accessibilityLayer>
                <CartesianGrid
                  vertical={false}
                  stroke="rgb(255 255 255 / 5%)"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={20}
                  tick={chartAxisTick}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={chartAxisTick}
                  width={36}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="linear"
                  dataKey="hrv"
                  stroke={NEON_ACCENTS.cyan.chart}
                  fill={NEON_ACCENTS.cyan.chart}
                  fillOpacity={0.05}
                  strokeWidth={1.5}
                  connectNulls
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="py-12 text-center text-sm text-zinc-500">
              Sem dados de HRV nos últimos 14 dias.
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
