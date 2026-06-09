import { Suspense } from "react"

import { BiometrySection } from "@/components/dashboard/biometry-section"
import { BiometrySectionSkeleton } from "@/components/dashboard/biometry-section-skeleton"
import { ChartsSection } from "@/components/dashboard/charts-section"
import { ChartsSectionSkeleton } from "@/components/dashboard/charts-section-skeleton"
import { DashboardSummary } from "@/components/dashboard/dashboard-summary"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { MealsList } from "@/components/dashboard/meals-list"
import { MealsListSkeleton } from "@/components/dashboard/meals-list-skeleton"
import { SupplementSection } from "@/components/suplementacao/supplement-section"
import { WearablePanel } from "@/components/dashboard/wearable-panel"
import { PageHeader } from "@/components/layout/page-header"
import { SyncStatusIndicatorsLoader } from "@/components/layout/sync-status-indicators"
import { PageShell } from "@/components/layout/page-shell"
import { SectionHeader } from "@/components/layout/section-header"
import { NeonCard } from "@/components/ui/neon-card"
import { Skeleton } from "@/components/ui/skeleton"

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  )
}

export default function HojePage() {
  return (
    <PageShell>
      <PageHeader
        title="Leandro R."
        subtitle="Painel operacional — nutrição, wearable e agenda"
        kicker="SYS.HEALTH"
        statusSlot={
          <Suspense
            fallback={
              <div className="flex gap-4">
                <div className="h-4 w-28 animate-pulse rounded bg-zinc-800/80" />
                <div className="h-4 w-24 animate-pulse rounded bg-zinc-800/80" />
              </div>
            }
          >
            <SyncStatusIndicatorsLoader />
          </Suspense>
        }
      />

      <Suspense fallback={<SummarySkeleton />}>
        <DashboardSummary />
      </Suspense>

      <DashboardTabs
        nutritionSlot={
          <div className="flex flex-col gap-5">
            <SupplementSection />

            <section className="flex flex-col gap-4">
              <SectionHeader
                title="Registros"
                subtitle="Refeições de hoje (horário de Brasília)"
              />
              <Suspense fallback={<MealsListSkeleton />}>
                <MealsList />
              </Suspense>
            </section>

            <Suspense fallback={<BiometrySectionSkeleton />}>
              <BiometrySection showHeader />
            </Suspense>
          </div>
        }
        wearableSlot={
          <Suspense
            fallback={
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            }
          >
            <WearablePanel />
          </Suspense>
        }
        agendaSlot={
          <NeonCard accent="magenta" className="px-6 py-10 text-center">
            <p className="neon-section-title">Agenda</p>
            <p className="mt-3 text-sm text-slate-400">
              Google Calendar ainda não está integrado nesta versão web. A
              sincronização existia apenas no app legado (Streamlit) e será
              adicionada em uma próxima atualização.
            </p>
          </NeonCard>
        }
      />

      <Suspense fallback={<ChartsSectionSkeleton />}>
        <ChartsSection />
      </Suspense>
    </PageShell>
  )
}
