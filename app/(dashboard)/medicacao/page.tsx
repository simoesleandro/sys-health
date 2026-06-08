import { MedicationChecklist } from "@/components/medicacao/medication-checklist"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { getMedicationChecklist } from "@/lib/data"

export default async function MedicacaoPage() {
  const items = await getMedicationChecklist()

  return (
    <PageShell className="max-w-2xl">
      <PageHeader
        title="Medicação"
        subtitle="Marque os itens tomados hoje (BRT)"
        kicker="SYS.HEALTH"
      />

      <MedicationChecklist initialItems={items} />
    </PageShell>
  )
}
