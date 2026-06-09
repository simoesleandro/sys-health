import { Suspense } from "react"

import { HistoricoDatePicker } from "@/components/historico/date-picker"
import { HistoryDayDetails } from "@/components/historico/history-day-details"
import { HistorySummary } from "@/components/historico/history-summary"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { Skeleton } from "@/components/ui/skeleton"
import { getDayHistoryDetails, getDayHistorySummary } from "@/lib/data"
import { formatBrtDateLabel } from "@/lib/date-utils"
import { resolveHistoricoDate } from "@/lib/historico"

type HistoricoPageProps = {
  searchParams: Promise<{ data?: string }>
}

export default async function HistoricoPage({ searchParams }: HistoricoPageProps) {
  const params = await searchParams
  const selectedDate = resolveHistoricoDate(params.data)
  const [summary, details] = await Promise.all([
    getDayHistorySummary(selectedDate),
    getDayHistoryDetails(selectedDate),
  ])

  return (
    <PageShell>
      <PageHeader
        title="Histórico"
        subtitle={formatBrtDateLabel(selectedDate)}
        kicker="SYS.HEALTH"
      >
        <Suspense fallback={<Skeleton className="h-10 w-56 rounded-xl" />}>
          <HistoricoDatePicker selectedDate={selectedDate} />
        </Suspense>
      </PageHeader>

      <HistorySummary
        summary={{
          calorias: summary.kpi.calorias,
          proteina: summary.kpi.proteina,
          agua: summary.kpi.agua,
          balanco: summary.kpi.balanco,
          passos: summary.passos,
          sono: summary.sono,
          caloriasAtivas: summary.caloriasAtivas,
          refeicoes: summary.refeicoes,
          evacuacoes: summary.evacuacoes,
        }}
      />

      <div className="mt-6">
        <HistoryDayDetails
          meals={details.meals}
          hevyWorkouts={details.hevyWorkouts}
          zeppSessions={details.zeppSessions}
          evacuations={details.evacuations}
        />
      </div>
    </PageShell>
  )
}
