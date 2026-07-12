import {
  MEASUREMENT_FIELDS,
  formatMeasurementDateLabel,
  pickLatestMeasurementRecord,
} from "@/lib/biometry"
import { getMeasurementsHistory } from "@/lib/data"
import { neonCardClasses } from "@/lib/neon-theme"
import { cn } from "@/lib/utils"

function formatValue(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—"
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })
}

export async function MeasurementsHistoryTable() {
  const records = await getMeasurementsHistory()

  if (records.length === 0) {
    return (
      <section className={cn(neonCardClasses("blue"), "p-5")}>
        <h2 className="neon-section-title">
          Histórico de medições
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Nenhuma medição registrada ainda. Use &quot;Registrar Medidas&quot; para
          adicionar a primeira.
        </p>
      </section>
    )
  }

  const latestRecord = pickLatestMeasurementRecord(records)
  const latestRecordId = latestRecord?.id ?? null
  const recent = [...records].reverse().slice(0, 24)

  return (
    <section className={cn(neonCardClasses("blue"), "overflow-hidden p-5")}>
      <div className="mb-4">
        <h2 className="neon-section-title">
          Histórico de medições corporais
        </h2>
        <p className="neon-section-subtitle mt-1">
          {records.length} registro(s) · exibindo os mais recentes
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/20">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-brand-blue/5 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
              <th className="px-2 py-2">Data</th>
              {MEASUREMENT_FIELDS.map((field) => (
                <th key={field.key} className="px-2 py-2">
                  {field.label.replace(" (kg)", "").replace(" (cm)", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((record) => {
              const isLatest = record.id === latestRecordId

              return (
                <tr
                  key={record.id}
                  className={cn(
                    "border-b border-white/10 text-slate-300",
                    isLatest && "bg-brand-cyan/10"
                  )}
                >
                  <td
                    className={cn(
                      "whitespace-nowrap px-2 py-2.5 font-medium text-white",
                      isLatest &&
                        "border-l-4 border-brand-cyan bg-brand-cyan/10 pl-3"
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      {formatMeasurementDateLabel(record.data)}
                      {isLatest ? (
                        <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-cyan uppercase">
                          Mais recente
                        </span>
                      ) : null}
                    </span>
                  </td>
                  {MEASUREMENT_FIELDS.map((field) => (
                    <td
                      key={field.key}
                      className={cn(
                        "px-2 py-2.5 tabular-nums",
                        isLatest && "bg-brand-cyan/10 font-semibold text-white"
                      )}
                    >
                      {formatValue(record[field.key])}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
