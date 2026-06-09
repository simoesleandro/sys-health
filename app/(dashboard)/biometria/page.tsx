import { Suspense } from "react"

import { MeasurementsHistoryTable } from "@/components/biometria/measurements-history-table"
import { BiometrySection } from "@/components/dashboard/biometry-section"
import { BiometrySectionSkeleton } from "@/components/dashboard/biometry-section-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"

export default function BiometriaPage() {
  return (
    <PageShell>
      <PageHeader
        title="Biometria"
        subtitle="Peso e perímetros corporais"
        kicker="SYS.HEALTH"
      />

      <Suspense fallback={<BiometrySectionSkeleton />}>
        <BiometrySection showHeader={false} />
      </Suspense>

      <Suspense
        fallback={
          <Skeleton className="mt-6 h-64 w-full rounded-xl border border-zinc-800/60" />
        }
      >
        <MeasurementsHistoryTable />
      </Suspense>
    </PageShell>
  )
}
