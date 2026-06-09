import { BrandMetricCard } from "@/components/ui/brand-metric-card"

export type HistorySummaryData = {
  calorias: string
  proteina: string
  agua: string
  balanco: string
  passos: string
  sono: string
  caloriasAtivas: string
  refeicoes: string
  evacuacoes: string
}

export function HistorySummary({ summary }: { summary: HistorySummaryData }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <BrandMetricCard
        label="Calorias"
        value={summary.calorias}
        accent="cyan"
      />
      <BrandMetricCard
        label="Proteína"
        value={summary.proteina}
        accent="magenta"
      />
      <BrandMetricCard label="Água" value={summary.agua} accent="blue" />
      <BrandMetricCard
        label="Balanço"
        value={summary.balanco}
        accent="green"
      />
      <BrandMetricCard label="Passos" value={summary.passos} accent="purple" />
      <BrandMetricCard label="Sono" value={summary.sono} accent="blue" />
      <BrandMetricCard
        label="Cal. ativas"
        value={summary.caloriasAtivas}
        accent="orange"
      />
      <BrandMetricCard
        label="Refeições"
        value={summary.refeicoes}
        accent="cyan"
      />
      <BrandMetricCard
        label="Evacuações"
        value={summary.evacuacoes}
        accent="green"
      />
    </div>
  )
}
