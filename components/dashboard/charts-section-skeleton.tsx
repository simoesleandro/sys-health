import { Skeleton } from "@/components/ui/skeleton"
import { NeonCard } from "@/components/ui/neon-card"

export function ChartsSectionSkeleton() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <NeonCard accent="cyan" className="p-5">
          <Skeleton className="h-72 rounded-xl" />
        </NeonCard>
        <NeonCard accent="green" className="p-5">
          <Skeleton className="h-72 rounded-xl" />
        </NeonCard>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <NeonCard accent="purple" className="p-5">
          <Skeleton className="h-64 rounded-xl" />
        </NeonCard>
        <NeonCard accent="blue" className="p-5">
          <Skeleton className="h-64 rounded-xl" />
        </NeonCard>
      </div>
    </section>
  )
}
