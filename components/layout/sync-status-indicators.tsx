import { SyncHeaderBar } from "@/components/layout/sync-header-bar"
import { getSyncStatus } from "@/lib/data"

export { SyncStatusIndicators } from "@/components/layout/sync-status-tags"

export async function SyncStatusIndicatorsLoader() {
  const status = await getSyncStatus()
  return (
    <SyncHeaderBar amazfit={status.amazfit} hevy={status.hevy} />
  )
}
