import { EvacuationActions } from "@/components/evacuacao/evacuation-actions"
import { EvacuationSummaryBar } from "@/components/evacuacao/evacuation-summary-bar"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { getEvacuationHistory } from "@/lib/data"
import { buildEvacuationStats } from "@/lib/evacuation-stats"

export default async function EvacuacaoPage() {
  const history = await getEvacuationHistory()
  const stats = buildEvacuationStats(history)

  return (
    <PageShell>
      <PageHeader
        title="Registro Intestinal"
        subtitle="Escala de Bristol — selecione o tipo de hoje"
        kicker="SYS.HEALTH"
      />

      <EvacuationSummaryBar stats={stats} />

      <EvacuationActions history={history} />
    </PageShell>
  )
}
