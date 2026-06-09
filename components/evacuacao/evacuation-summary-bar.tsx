import { BrandMetricCard } from "@/components/ui/brand-metric-card"
import type { EvacuationStats } from "@/lib/evacuation-stats"

export function EvacuationSummaryBar({ stats }: { stats: EvacuationStats }) {
  const averageValue =
    stats.averageBristol != null
      ? stats.averageBristol.toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : "—"

  return (
    <section
      aria-label="Resumo intestinal"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      <BrandMetricCard
        label="Último dia"
        value={stats.lastRecordLabel}
        meta={stats.lastRecordMeta}
        accent="green"
      />
      <BrandMetricCard
        label="Média Bristol"
        value={averageValue}
        meta={stats.averageBristolMeta}
        accent="purple"
      />
      <BrandMetricCard
        label="Desde a última"
        value={stats.timeSinceLast}
        meta={stats.timeSinceLastMeta}
        accent="cyan"
      />
    </section>
  )
}
