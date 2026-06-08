import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { NeonCard } from "@/components/ui/neon-card"

type SectionPlaceholderProps = {
  title: string
  description: string
}

export function SectionPlaceholder({
  title,
  description,
}: SectionPlaceholderProps) {
  return (
    <PageShell>
      <PageHeader title={title} subtitle={description} kicker="SYS.HEALTH" />
      <NeonCard accent="cyan" className="px-8 py-10 text-center">
        <p className="text-sm text-slate-400">Conteúdo em migração do Streamlit</p>
      </NeonCard>
    </PageShell>
  )
}
