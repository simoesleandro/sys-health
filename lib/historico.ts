import { isBrtDateString } from "@/lib/date-utils"
import { getBrtUtcBoundsForOffset } from "@/lib/data"

export function getDefaultHistoricoDate() {
  return getBrtUtcBoundsForOffset(1).brtDate
}

export function resolveHistoricoDate(dataParam?: string | null) {
  if (dataParam && isBrtDateString(dataParam)) {
    return dataParam
  }
  return getDefaultHistoricoDate()
}
