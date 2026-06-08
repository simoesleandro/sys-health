import { Suspense } from "react"

import { TrendGrid } from "@/components/evolucao/trend-grid"
import { Skeleton } from "@/components/ui/skeleton"
import { get14DayTrends } from "@/lib/trends"

function TrendsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-xl" />
      ))}
    </div>
  )
}

async function TrendsContent() {
  const metrics = await get14DayTrends()
  return <TrendGrid metrics={metrics} />
}

export function TrendsSection() {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="neon-section-title">Tendências — 14 dias</h2>
        <p className="neon-section-subtitle mt-1">
          Média recente vs. 14 dias anteriores · delta %
        </p>
      </div>
      <Suspense fallback={<TrendsSkeleton />}>
        <TrendsContent />
      </Suspense>
    </section>
  )
}
