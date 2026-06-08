import { Suspense } from "react"

import { BiometrySection } from "@/components/dashboard/biometry-section"
import { BiometrySectionSkeleton } from "@/components/dashboard/biometry-section-skeleton"
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
    </PageShell>
  )
}
