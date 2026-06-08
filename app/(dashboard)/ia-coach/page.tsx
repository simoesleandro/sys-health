import { ChatInterface } from "@/components/ia-coach/chat-interface"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"

export default function IaCoachPage() {
  return (
    <PageShell className="h-[calc(100dvh-5rem)] max-w-3xl md:h-[calc(100dvh-3rem)]">
      <PageHeader
        title="IA Coach"
        subtitle="Orientações com base nos seus dados de hoje"
        kicker="SYS.HEALTH"
      />

      <ChatInterface />
    </PageShell>
  )
}
