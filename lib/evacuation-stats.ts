import type { BristolType, EvacuationRecord } from "@/lib/evacuation"

export type EvacuationStats = {
  lastRecordLabel: string
  lastRecordMeta: string
  averageBristol: number | null
  averageBristolMeta: string
  timeSinceLast: string
  timeSinceLastMeta: string
}

const AVERAGE_WINDOW_DAYS = 14

function parseUtcMs(iso: string) {
  const ms = Date.parse(iso)
  return Number.isFinite(ms) ? ms : null
}

function formatBrtDateLabel(iso: string) {
  const ms = parseUtcMs(iso)
  if (ms == null) return "—"

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(ms))
}

function formatRelativeSince(iso: string, nowMs = Date.now()) {
  const ms = parseUtcMs(iso)
  if (ms == null) return "—"

  const diffMs = Math.max(0, nowMs - ms)
  const minutes = Math.floor(diffMs / 60_000)

  if (minutes < 1) return "Agora há pouco"
  if (minutes < 60) return `Há ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Há ${hours}h`

  const days = Math.floor(hours / 24)
  if (days === 1) return "Há 1 dia"
  if (days < 7) return `Há ${days} dias`

  const weeks = Math.floor(days / 7)
  if (weeks < 5) return weeks === 1 ? "Há 1 semana" : `Há ${weeks} semanas`

  const months = Math.floor(days / 30)
  return months <= 1 ? "Há ~1 mês" : `Há ~${months} meses`
}

function isValidBristolTipo(tipo: number): tipo is BristolType {
  return Number.isInteger(tipo) && tipo >= 1 && tipo <= 7
}

function averageBristolInWindow(records: EvacuationRecord[], windowDays: number) {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000
  const tipos = records
    .filter((record) => {
      const ms = parseUtcMs(record.dataHora)
      return ms != null && ms >= cutoff && isValidBristolTipo(record.tipo)
    })
    .map((record) => record.tipo)

  if (!tipos.length) return null

  const sum = tipos.reduce((acc, tipo) => acc + tipo, 0)
  return Math.round((sum / tipos.length) * 10) / 10
}

export function buildEvacuationStats(
  records: EvacuationRecord[],
  nowMs = Date.now()
): EvacuationStats {
  const sorted = [...records].sort(
    (a, b) => parseUtcMs(b.dataHora)! - parseUtcMs(a.dataHora)!
  )
  const last = sorted[0]

  if (!last) {
    return {
      lastRecordLabel: "—",
      lastRecordMeta: "Nenhum registro",
      averageBristol: null,
      averageBristolMeta: `Últimos ${AVERAGE_WINDOW_DAYS} dias`,
      timeSinceLast: "—",
      timeSinceLastMeta: "Sem histórico",
    }
  }

  const average = averageBristolInWindow(sorted, AVERAGE_WINDOW_DAYS)
  const windowCount = sorted.filter((record) => {
    const ms = parseUtcMs(record.dataHora)
    return (
      ms != null &&
      ms >= nowMs - AVERAGE_WINDOW_DAYS * 24 * 60 * 60 * 1000 &&
      isValidBristolTipo(record.tipo)
    )
  }).length

  return {
    lastRecordLabel: formatBrtDateLabel(last.dataHora),
    lastRecordMeta: `${last.tipoLabel.split(" — ")[0]} · ${last.horaLabel}`,
    averageBristol: average,
    averageBristolMeta:
      windowCount > 0
        ? `${windowCount} registro(s) · últimos ${AVERAGE_WINDOW_DAYS}d`
        : `Últimos ${AVERAGE_WINDOW_DAYS} dias`,
    timeSinceLast: formatRelativeSince(last.dataHora, nowMs),
    timeSinceLastMeta: `Último às ${last.horaLabel} (BRT)`,
  }
}
