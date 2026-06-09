/** Utilitários de data/hora em America/Sao_Paulo — sem dependências de servidor. */

/** Limites UTC [início, fim) do dia civil em America/Sao_Paulo. */
export function getBrtTodayUtcBounds(now = new Date()) {
  return getBrtUtcBoundsForOffset(0, now)
}

/** Limites UTC [início, fim) para uma data civil BRT (YYYY-MM-DD). */
export function getBrtUtcBoundsForDate(brtDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(brtDate)
  if (!match) {
    return getBrtUtcBoundsForOffset(1)
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const start = new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0))
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  return {
    brtDate: `${match[1]}-${match[2]}-${match[3]}`,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

/** Limites UTC de um dia civil em BRT (0 = hoje, 1 = ontem, …). */
export function getBrtUtcBoundsForOffset(daysAgo = 0, now = new Date()) {
  const brtDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(now)

  const [year, month, day] = brtDate.split("-").map(Number)
  const start = new Date(
    Date.UTC(year, month - 1, day - daysAgo, 3, 0, 0, 0)
  )
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

  const dayLabel = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(start.getTime() + 12 * 60 * 60 * 1000))

  return {
    brtDate: dayLabel,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

/** Normaliza data_hora do Postgres/Supabase para instante UTC (ms). */
export function parseDataHoraUtcMs(dataHora: string) {
  const trimmed = dataHora.trim()
  const iso = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T")

  const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(iso)
  const normalized = hasTimezone ? iso : `${iso}Z`

  const ms = Date.parse(normalized)
  return Number.isNaN(ms) ? 0 : ms
}

export function formatMealTimeBrt(dataHora: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(parseDataHoraUtcMs(dataHora)))
}
