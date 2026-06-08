import { Skeleton } from "@/components/ui/skeleton"

export function SidebarKpisSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 px-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-md border border-sidebar-border bg-sidebar-accent/20 px-2 py-1.5"
        >
          <Skeleton className="mb-1.5 h-2.5 w-12" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}
