import { Skeleton } from "@/components/ui/skeleton"

export function SidebarAmazfitSkeleton() {
  return (
    <div className="shrink-0 rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3">
      <Skeleton className="mb-2 h-3.5 w-24" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-md bg-sidebar-accent/20 px-2 py-1.5"
          >
            <Skeleton className="mb-1.5 h-2.5 w-10" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
    </div>
  )
}
