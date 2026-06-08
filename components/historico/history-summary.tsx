import { BrandMetricCard } from "@/components/ui/brand-metric-card"

export type HistorySummaryData = {
  calorias: string
  passos: string
  sono: string
}

export function HistorySummary({ summary }: { summary: HistorySummaryData }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <BrandMetricCard
        label="Calorias"
        value={summary.calorias}
        accent="cyan"
      />
      <BrandMetricCard label="Passos" value={summary.passos} accent="purple" />
      <BrandMetricCard label="Sono" value={summary.sono} accent="blue" />
    </div>
  )
}
