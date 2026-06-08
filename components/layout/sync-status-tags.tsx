import type { SyncSourceStatus } from "@/lib/data"
import { cn } from "@/lib/utils"

function SyncStatusTag({
  label,
  status,
}: {
  label: string
  status: SyncSourceStatus
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          status.synced
            ? "animate-pulse bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"
            : "bg-zinc-600 shadow-[0_0_4px_rgba(113,113,122,0.4)]"
        )}
        aria-hidden
      />
      <span className="text-xs font-medium text-zinc-400">
        {label} · {status.statusLabel}
      </span>
    </div>
  )
}

export function SyncStatusIndicators({
  amazfit,
  hevy,
}: {
  amazfit: SyncSourceStatus
  hevy: SyncSourceStatus
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <SyncStatusTag label="Amazfit" status={amazfit} />
      <SyncStatusTag label="Hevy" status={hevy} />
    </div>
  )
}
