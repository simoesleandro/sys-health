"use client"

import { TrendCard } from "@/components/evolucao/trend-card"
import type { TrendMetricData } from "@/lib/trends"

export function TrendGrid({ metrics }: { metrics: TrendMetricData[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {metrics.map((metric) => (
        <TrendCard key={metric.id} metric={metric} />
      ))}
    </div>
  )
}
