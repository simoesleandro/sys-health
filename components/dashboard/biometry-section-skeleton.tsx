import { Skeleton } from "@/components/ui/skeleton"

export function BiometrySectionSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="mb-2 h-4 w-28" />
        <Skeleton className="mb-2 h-8 w-24" />
        <Skeleton className="h-4 w-40" />
      </div>
    </section>
  )
}
