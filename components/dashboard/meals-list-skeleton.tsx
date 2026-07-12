import { NeonCard } from "@/components/ui/neon-card"
import { Skeleton } from "@/components/ui/skeleton"

export function MealsListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <NeonCard key={index} accent="cyan" className="overflow-hidden">
          <div className="border-b border-brand-cyan/20 px-4 py-3">
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="space-y-2 px-4 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="border-t border-brand-cyan/20 px-4 py-3">
            <Skeleton className="h-3 w-48" />
          </div>
        </NeonCard>
      ))}
    </div>
  )
}
