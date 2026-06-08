import { Suspense } from "react"

import { ChartsSection } from "@/components/dashboard/charts-section"
import { ChartsSectionSkeleton } from "@/components/dashboard/charts-section-skeleton"
import { TrendsSection } from "@/components/evolucao/trends-section"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"

export default function EvolucaoPage() {
  return (
    <PageShell>
      <PageHeader
        title="Evolução"
        subtitle="Médias de 14 dias, tendências e gráficos detalhados"
        kicker="SYS.HEALTH"
      />

      <TrendsSection />

      <Suspense fallback={<ChartsSectionSkeleton />}>
        <ChartsSection showHeader={false} />
      </Suspense>
    </PageShell>
  )
}
