import { Suspense } from "react"

import { SupplementGrid } from "@/components/suplementacao/supplement-grid"
import { SectionHeader } from "@/components/layout/section-header"
import { Skeleton } from "@/components/ui/skeleton"
import { getTodaySupplementGrid } from "@/lib/data"

function SupplementGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton key={index} className="h-36 rounded-xl" />
      ))}
    </div>
  )
}

async function SupplementGridContent() {
  const items = await getTodaySupplementGrid()
  return <SupplementGrid initialItems={items} />
}

export function SupplementSection() {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title="Suplementação"
        subtitle="Status de hoje — registe pelo botão + Suplementos na barra rápida"
      />
      <Suspense fallback={<SupplementGridSkeleton />}>
        <SupplementGridContent />
      </Suspense>
    </section>
  )
}
