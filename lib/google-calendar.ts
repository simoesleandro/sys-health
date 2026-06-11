import { cache } from "react"
import { google } from "googleapis"

import { getBrtTodayUtcBounds } from "@/lib/brt-time"
import {
  getGoogleCalendarId,
  getGoogleClientId,
  getGoogleClientSecret,
  getGoogleRefreshToken,
  isGoogleCalendarConfigured,
} from "@/lib/google-calendar-env"

export type CalendarAgendaEvent = {
  id: string
  title: string
  timeLabel: string
  endTimeLabel: string | null
  location: string | null
  allDay: boolean
}

export type CalendarAgendaResult = {
  configured: boolean
  brtDate: string
  events: CalendarAgendaEvent[]
  error: string | null
}

function formatEventTime(iso: string, allDay: boolean) {
  if (allDay) return "Dia inteiro"

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso))
}

function formatCalendarFetchError(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : "Erro ao buscar agenda."

  if (raw.includes("invalid_grant")) {
    return (
      "Token do Google Calendar expirou ou foi revogado. Rode node scripts/get-gcal-token.mjs, " +
      "atualize GOOGLE_REFRESH_TOKEN no .env.local (e na Vercel em produção) e reinicie o servidor."
    )
  }

  return raw
}

function mapCalendarEvent(
  event: {
    id?: string | null
    summary?: string | null
    location?: string | null
    start?: { dateTime?: string | null; date?: string | null } | null
    end?: { dateTime?: string | null; date?: string | null } | null
  }
): CalendarAgendaEvent | null {
  const id = event.id ? String(event.id) : null
  if (!id) return null

  const allDay = Boolean(event.start?.date && !event.start?.dateTime)
  const startRaw = event.start?.dateTime ?? event.start?.date
  if (!startRaw) return null

  const endRaw = event.end?.dateTime ?? event.end?.date ?? null

  return {
    id,
    title: String(event.summary ?? "Sem título"),
    timeLabel: formatEventTime(startRaw, allDay),
    endTimeLabel:
      endRaw && !allDay ? formatEventTime(endRaw, false) : null,
    location: event.location ? String(event.location) : null,
    allDay,
  }
}

async function fetchTodayCalendarEvents(): Promise<CalendarAgendaResult> {
  const { brtDate, startIso, endIso } = getBrtTodayUtcBounds()

  if (!isGoogleCalendarConfigured()) {
    return {
      configured: false,
      brtDate,
      events: [],
      error: null,
    }
  }

  const clientId = getGoogleClientId()!
  const clientSecret = getGoogleClientSecret()!
  const refreshToken = getGoogleRefreshToken()!

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const calendar = google.calendar({ version: "v3", auth: oauth2Client })
    const response = await calendar.events.list({
      calendarId: getGoogleCalendarId(),
      timeMin: startIso,
      timeMax: endIso,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 40,
    })

    const events = (response.data.items ?? [])
      .map((item) => mapCalendarEvent(item))
      .filter((item): item is CalendarAgendaEvent => item != null)

    return {
      configured: true,
      brtDate,
      events,
      error: null,
    }
  } catch (error) {
    const message = formatCalendarFetchError(error)

    return {
      configured: true,
      brtDate,
      events: [],
      error: message,
    }
  }
}

export const getTodayCalendarAgenda = cache(fetchTodayCalendarEvents)
