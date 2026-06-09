import { calcPaceSecondsPerKm } from "@/lib/treinos"

const ZEPP_API_BASE = "https://api-mifit-us3.zepp.com"

export type ZeppAmazfitRow = {
  data_hora: string
  passos: number
  calorias_gastas: number
  distancia_km: number
  sono_total_min: number
  sono_profundo_min: number
  hrv_ms: number
  pai: number
  corrida_km: number
  corrida_cal: number
}

export function decodeZeppSummary(summaryB64: string): Record<string, unknown> {
  if (!summaryB64) return {}

  try {
    const pad =
      summaryB64 + "=".repeat((4 - (summaryB64.length % 4)) % 4)
    const decoded = Buffer.from(pad, "base64").toString("utf-8")
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return {}
  }
}

export type ZeppHrvPaiSnapshot = {
  hrv_ms: number | null
  pai: number | null
}

export type ZeppUserEventItem = Record<string, unknown>

function parseZeppEventNumber(value: unknown) {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function getBrtDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(date)
}

function brtDateFromEventMs(ms: number) {
  return getBrtDateString(new Date(ms))
}

/** Limites UTC (ms) do dia civil em America/Sao_Paulo. */
export function getBrtDayBoundsMs(dayString: string) {
  const start = new Date(`${dayString}T00:00:00-03:00`).getTime()
  const end = new Date(`${dayString}T23:59:59.999-03:00`).getTime()
  return { start, end }
}

export function getBrtDayBoundsMsWithLookback(
  dayString: string,
  daysBack = 7
) {
  const { end } = getBrtDayBoundsMs(dayString)
  const start =
    new Date(`${dayString}T00:00:00-03:00`).getTime() -
    daysBack * 24 * 60 * 60 * 1000

  return { start, end }
}

type ReadinessHrvCandidate = {
  hrv: number
  updated: number
  dayFromUpdate: string | null
  dayFromTimestamp: string | null
}

function collectReadinessHrvCandidates(
  items: ZeppUserEventItem[]
): ReadinessHrvCandidate[] {
  const candidates: ReadinessHrvCandidate[] = []

  for (const item of items) {
    if (item.subType === "watch_score_data") continue

    const hrv = parseZeppEventNumber(item.sleepHRV)
    if (hrv == null || hrv <= 0) continue

    const updated =
      parseZeppEventNumber(item.timestampUpdate) ??
      parseZeppEventNumber(item.timestamp) ??
      0
    const timestamp = parseZeppEventNumber(item.timestamp) ?? 0

    candidates.push({
      hrv: Math.round(hrv),
      updated,
      dayFromUpdate: updated > 0 ? brtDateFromEventMs(updated) : null,
      dayFromTimestamp: timestamp > 0 ? brtDateFromEventMs(timestamp) : null,
    })
  }

  return candidates
}

function pickLatestHrvCandidate(candidates: ReadinessHrvCandidate[]) {
  return [...candidates].sort((a, b) => b.updated - a.updated)[0] ?? null
}

export function extractHrvMsFromReadinessEvents(
  items: ZeppUserEventItem[],
  targetDay: string,
  options: { allowLatestFallback?: boolean } = {}
): number | null {
  const candidates = collectReadinessHrvCandidates(items)
  if (!candidates.length) return null

  const exactUpdateDay = candidates.filter(
    (item) => item.dayFromUpdate === targetDay
  )
  if (exactUpdateDay.length) {
    return pickLatestHrvCandidate(exactUpdateDay)?.hrv ?? null
  }

  const exactTimestampDay = candidates.filter(
    (item) => item.dayFromTimestamp === targetDay
  )
  if (exactTimestampDay.length) {
    return pickLatestHrvCandidate(exactTimestampDay)?.hrv ?? null
  }

  if (options.allowLatestFallback) {
    return pickLatestHrvCandidate(candidates)?.hrv ?? null
  }

  return null
}

export function extractPaiFromPaiHealthEvents(
  items: ZeppUserEventItem[]
): number | null {
  let best: { pai: number; updated: number } | null = null

  for (const item of items) {
    const pai = parseZeppEventNumber(item.totalPai)
    if (pai == null || pai <= 0) continue

    const updated =
      parseZeppEventNumber(item.uploadTimestamp) ??
      parseZeppEventNumber(item.timestamp) ??
      0

    if (!best || updated >= best.updated) {
      best = { pai: Math.round(pai), updated }
    }
  }

  return best?.pai ?? null
}

export function resolveZeppHrvPai({
  fromApi,
  existing = {},
}: {
  fromApi: ZeppHrvPaiSnapshot
  existing?: { hrv_ms?: number | null; pai?: number | null }
}) {
  const hrv_ms =
    fromApi.hrv_ms != null && fromApi.hrv_ms > 0
      ? fromApi.hrv_ms
      : Number(existing.hrv_ms ?? 0) || 0

  const pai =
    fromApi.pai != null && fromApi.pai > 0
      ? fromApi.pai
      : Number(existing.pai ?? 0) || 0

  return { hrv_ms, pai }
}

export function mapZeppSummaryToRow(
  dayString: string,
  summary: Record<string, unknown>,
  options: {
    existing?: {
      hrv_ms?: number | null
      pai?: number | null
      sono_total_min?: number | null
      sono_profundo_min?: number | null
    }
    hrvMs?: number | null
    pai?: number | null
  } = {}
): ZeppAmazfitRow {
  const { existing = {}, hrvMs, pai } = options
  const resolved = resolveZeppHrvPai({
    fromApi: { hrv_ms: hrvMs ?? null, pai: pai ?? null },
    existing,
  })
  const stp = (summary.stp as Record<string, unknown> | undefined) ?? {}
  const slp = (summary.slp as Record<string, unknown> | undefined) ?? {}

  const deep = Number(slp.dp ?? 0) || 0
  const light = Number(slp.lt ?? 0) || 0
  const rem = Number(slp.dt ?? 0) || 0
  const sleepFromApi =
    deep + light + rem || Number(slp.ebt ?? 0) || 0
  const sleepTotal =
    sleepFromApi > 0
      ? sleepFromApi
      : Number(existing.sono_total_min ?? 0) || 0
  const deepSleep =
    deep > 0 ? deep : Number(existing.sono_profundo_min ?? 0) || 0

  const runDistM = Number(stp.runDist ?? 0) || 0
  const runCal = Number(stp.runCal ?? 0) || 0

  return {
    data_hora: `${dayString} 00:00:00`,
    passos: Number(stp.ttl ?? 0) || 0,
    calorias_gastas: Number(stp.cal ?? 0) || 0,
    distancia_km:
      Math.round((Number(stp.dis ?? 0) / 1000) * 100) / 100,
    sono_total_min: sleepTotal,
    sono_profundo_min: deepSleep,
    hrv_ms: resolved.hrv_ms,
    pai: resolved.pai,
    corrida_km: Math.round((runDistM / 1000) * 100) / 100,
    corrida_cal: runCal,
  }
}

export function buildZeppHeaders(appToken: string) {
  return {
    Accept: "*/*",
    apptoken: appToken,
    appname: "com.huami.midong",
    appplatform: "ios_phone",
    channel: "appstore",
    country: "BR",
    lang: "pt_BR",
    timezone: "America/Sao_Paulo",
    "User-Agent": "Zepp/10.3.1 (iPhone; iOS 26.4.2; Scale/3.00)",
    v: "2.0",
  }
}

export async function fetchZeppBandSummary(
  dayString: string,
  appToken: string,
  userId: string
) {
  const params = new URLSearchParams({
    query_type: "summary",
    device_type: "0",
    object_id: userId,
    from_date: dayString,
    to_date: dayString,
  })

  const response = await fetch(
    `${ZEPP_API_BASE}/v1/data/band_data.json?${params.toString()}`,
    {
      headers: buildZeppHeaders(appToken),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Zepp HTTP ${response.status}`)
  }

  const payload = (await response.json()) as {
    code?: number | string
    message?: string
    data?: Array<{ summary?: string }>
  }

  const code = payload.code
  if (code != null && code !== 1 && code !== "1" && code !== 0 && code !== "0") {
    throw new Error(
      `Zepp API code=${String(code)}: ${payload.message ?? "erro"}`
    )
  }

  const items = payload.data ?? []
  if (!items.length) {
    return null
  }

  const summaryB64 = items[0]?.summary ?? ""
  return decodeZeppSummary(summaryB64)
}

export async function fetchZeppUserEvents(
  dayString: string,
  eventType: string,
  appToken: string,
  userId: string,
  options: { lookbackDays?: number; limit?: number } = {}
): Promise<ZeppUserEventItem[]> {
  const { lookbackDays = 0, limit = 20 } = options
  const { start, end } =
    lookbackDays > 0
      ? getBrtDayBoundsMsWithLookback(dayString, lookbackDays)
      : getBrtDayBoundsMs(dayString)

  const params = new URLSearchParams({
    limit: String(limit),
    from: String(start),
    to: String(end),
    eventType,
    timeZone: "America/Sao_Paulo",
  })

  const response = await fetch(
    `${ZEPP_API_BASE}/users/${userId}/events?${params.toString()}`,
    {
      headers: buildZeppHeaders(appToken),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Zepp events HTTP ${response.status}`)
  }

  const payload = (await response.json()) as {
    items?: ZeppUserEventItem[]
  }

  return Array.isArray(payload.items) ? payload.items : []
}

export async function fetchZeppHrvPaiForDay(
  dayString: string,
  appToken: string,
  userId: string
): Promise<ZeppHrvPaiSnapshot> {
  try {
    const [paiEvents, readinessEvents] = await Promise.all([
      fetchZeppUserEvents(dayString, "PaiHealthInfo", appToken, userId),
      fetchZeppUserEvents(dayString, "readiness", appToken, userId, {
        lookbackDays: 7,
        limit: 30,
      }),
    ])

    const hrv_ms = extractHrvMsFromReadinessEvents(readinessEvents, dayString, {
      allowLatestFallback: dayString === getBrtDateString(),
    })

    return {
      hrv_ms,
      pai: extractPaiFromPaiHealthEvents(paiEvents),
    }
  } catch (error) {
    console.warn("[fetchZeppHrvPaiForDay]", error)
    return { hrv_ms: null, pai: null }
  }
}

export type ZeppWorkoutApiItem = Record<string, unknown>

export type ZeppWorkoutRow = {
  track_id: string
  data_hora: string
  tipo: "Corrida" | "Caminhada"
  distancia_km: number
  duracao_minutos: number
  fc_media: number | null
  calorias: number | null
  pace_segundos_por_km: number | null
  sport_type: number | null
}

function parseZeppApiNumber(value: unknown) {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function parseZeppDistanceKm(dis: unknown) {
  const raw = parseZeppApiNumber(dis)
  if (raw == null || raw <= 0) return 0
  if (raw > 100) return Math.round((raw / 1000) * 100) / 100
  return Math.round(raw * 100) / 100
}

function inferWorkoutType(
  distanceKm: number,
  sportType: number | null,
  paceSecondsPerKm: number | null
) {
  if (sportType === 1 || sportType === 48) return "Corrida" as const
  if (sportType === 6 || sportType === 9) return "Caminhada" as const
  if (paceSecondsPerKm != null && paceSecondsPerKm >= 600) return "Caminhada" as const
  if (distanceKm > 0 && distanceKm < 3) return "Caminhada" as const
  return "Corrida" as const
}

export function mapZeppWorkoutApiItem(item: ZeppWorkoutApiItem): ZeppWorkoutRow | null {
  const trackId = String(item.trackid ?? item.track_id ?? "").trim()
  if (!trackId) return null

  const endTimeSec = parseInt(String(item.end_time ?? item.endTime ?? "0"), 10)
  if (!Number.isFinite(endTimeSec) || endTimeSec <= 0) return null

  const runTimeSec = parseInt(String(item.run_time ?? item.runTime ?? "0"), 10)
  const duracaoMinutos =
    runTimeSec > 0 ? Math.round(runTimeSec / 60) : 0

  const distanciaKm = parseZeppDistanceKm(item.dis ?? item.distance)
  const fcMedia = parseZeppApiNumber(item.avg_heart_rate ?? item.avgHeartRate)
  const calorias = parseZeppApiNumber(item.calorie ?? item.calories)
  const paceSeconds = calcPaceSecondsPerKm(duracaoMinutos, distanciaKm)
  const sportType = parseZeppApiNumber(item.type ?? item.sport_type)

  const dataHora = new Date(endTimeSec * 1000).toISOString()

  return {
    track_id: trackId,
    data_hora: dataHora,
    tipo: inferWorkoutType(distanciaKm, sportType, paceSeconds),
    distancia_km: distanciaKm,
    duracao_minutos: duracaoMinutos,
    fc_media: fcMedia,
    calorias: calorias,
    pace_segundos_por_km: paceSeconds,
    sport_type: sportType,
  }
}

export async function fetchZeppWorkoutHistory(
  appToken: string,
  userId: string,
  startTrackId: number,
  stopTrackId: number
) {
  const params = new URLSearchParams({
    userid: userId,
    need_sub_data: "1",
    startTrackId: String(startTrackId),
    stopTrackId: String(stopTrackId),
  })

  const response = await fetch(
    `${ZEPP_API_BASE}/v1/sport/run/history.json?${params.toString()}`,
    {
      headers: buildZeppHeaders(appToken),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(`Zepp workouts HTTP ${response.status}`)
  }

  const payload = (await response.json()) as {
    code?: number | string
    message?: string
    data?: { summary?: ZeppWorkoutApiItem[] }
    summary?: ZeppWorkoutApiItem[]
  }

  const code = payload.code
  if (code != null && code !== 1 && code !== "1" && code !== 0 && code !== "0") {
    throw new Error(
      `Zepp workouts API code=${String(code)}: ${payload.message ?? "erro"}`
    )
  }

  const summary = payload.data?.summary ?? payload.summary ?? []
  return Array.isArray(summary) ? summary : []
}
