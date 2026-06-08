import { Suspense } from "react"

import { MealsList } from "@/components/dashboard/meals-list"
import { MealsListSkeleton } from "@/components/dashboard/meals-list-skeleton"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"

export default function RegistrosPage() {
  return (
    <PageShell>
      <PageHeader
        title="Registros"
        subtitle="Refeições registradas hoje (horário de Brasília)"
        kicker="SYS.HEALTH"
      />

      <Suspense fallback={<MealsListSkeleton />}>
        <MealsList />
      </Suspense>
    </PageShell>
  )
}
