import { BristolSelector } from "@/components/evacuacao/bristol-selector"
import { TodayEvacuationHistory } from "@/components/evacuacao/today-evacuation-history"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { getTodayEvacuations } from "@/lib/data"

export default async function EvacuacaoPage() {
  const todayRecords = await getTodayEvacuations()

  return (
    <PageShell>
      <PageHeader
        title="Registo Intestinal"
        subtitle="Escala de Bristol — selecione o tipo de hoje"
        kicker="SYS.HEALTH"
      />

      <BristolSelector />

      <TodayEvacuationHistory records={todayRecords} />
    </PageShell>
  )
}
