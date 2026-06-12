import { CalendarRefreshButton } from "@/components/dashboard/calendar-refresh-button"
import { NeonCard } from "@/components/ui/neon-card"
import { getTodayCalendarAgenda } from "@/lib/google-calendar"

function EventRow({
  timeLabel,
  endTimeLabel,
  title,
  location,
}: {
  timeLabel: string
  endTimeLabel: string | null
  title: string
  location: string | null
}) {
  return (
    <li className="rounded-lg border border-zinc-800/50 bg-black/20 px-3 py-2.5">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-sm font-bold text-brand-magenta">
          {timeLabel}
          {endTimeLabel ? ` – ${endTimeLabel}` : null}
        </span>
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      {location ? (
        <p className="mt-1 text-xs text-slate-500">{location}</p>
      ) : null}
    </li>
  )
}

export async function CalendarAgendaPanel() {
  const agenda = await getTodayCalendarAgenda()

  if (!agenda.configured) {
    return (
      <NeonCard accent="magenta" className="px-5 py-6">
        <p className="neon-section-title">Agenda Google Calendar</p>
        <p className="neon-section-subtitle mt-2">
          Configure{" "}
          <code className="text-xs text-slate-400">GOOGLE_CLIENT_ID</code>,{" "}
          <code className="text-xs text-slate-400">GOOGLE_CLIENT_SECRET</code>{" "}
          e{" "}
          <code className="text-xs text-slate-400">GOOGLE_REFRESH_TOKEN</code>{" "}
          no <code className="text-xs text-slate-400">.env.local</code>. Use{" "}
          <code className="text-xs text-slate-400">
            node scripts/get-gcal-token.mjs
          </code>{" "}
          para gerar o refresh token (uma vez).
        </p>
      </NeonCard>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="neon-section-title">Agenda de hoje</p>
          <p className="neon-section-subtitle mt-0.5">
            Google Calendar · {agenda.brtDate} (BRT)
          </p>
        </div>
        <CalendarRefreshButton />
      </div>

      {agenda.error ? (
        <NeonCard accent="magenta" className="px-5 py-4">
          <p className="text-sm text-red-300">
            Não foi possível carregar a agenda: {agenda.error}
          </p>
          {agenda.error.includes("get-gcal-token") ? (
            <p className="mt-2 text-xs text-slate-500">
              {agenda.error.includes("Vercel")
                ? "Em produção, atualize as variáveis GOOGLE_* na Vercel e redeploy. Publique o app OAuth no Google Cloud para evitar renovação semanal."
                : "Depois de atualizar o token, reinicie o servidor e use o botão Atualizar na agenda."}
            </p>
          ) : null}
        </NeonCard>
      ) : agenda.events.length === 0 ? (
        <NeonCard accent="magenta" className="px-5 py-6 text-center">
          <p className="text-sm text-slate-400">
            Nenhum evento para hoje no calendário.
          </p>
        </NeonCard>
      ) : (
        <ul className="flex flex-col gap-2">
          {agenda.events.map((event) => (
            <EventRow
              key={event.id}
              timeLabel={event.timeLabel}
              endTimeLabel={event.endTimeLabel}
              title={event.title}
              location={event.location}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
