"use client"

import type { SyncSourceStatus } from "@/lib/data"

import { SyncStatusIndicators } from "@/components/layout/sync-status-tags"
import { ZeppSyncButton } from "@/components/layout/zepp-sync-button"

export function SyncHeaderBar({
  amazfit,
  hevy,
}: {
  amazfit: SyncSourceStatus
  hevy: SyncSourceStatus
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SyncStatusIndicators amazfit={amazfit} hevy={hevy} />
      <ZeppSyncButton />
    </div>
  )
}
