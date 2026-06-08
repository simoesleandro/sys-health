const BRT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isBrtDateString(value: string) {
  return BRT_DATE_PATTERN.test(value)
}

export function parseBrtDateString(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatBrtDateLabel(date: string) {
  const parsed = parseBrtDateString(date)

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed)
}
