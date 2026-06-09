import { MEASUREMENT_FIELDS } from "@/lib/biometry"
import { formatMeasurementDateLabel } from "@/lib/biometry"
import { getMeasurementsHistory } from "@/lib/data"

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
      <section className="rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-5">
        <h2 className="text-sm font-semibold text-white">
          Histórico de medições
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Nenhuma medição registrada ainda. Use &quot;Registrar Medidas&quot; para
          adicionar a primeira.
        </p>
      </section>
    )
  }

  const recent = [...records].reverse().slice(0, 24)

  return (
    <section className="rounded-xl border border-zinc-800/60 bg-zinc-950/50 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-white">
          Histórico de medições corporais
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {records.length} registro(s) · exibindo os mais recentes
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800/60 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">
              <th className="px-2 py-2">Data</th>
              {MEASUREMENT_FIELDS.map((field) => (
                <th key={field.key} className="px-2 py-2">
                  {field.label.replace(" (kg)", "").replace(" (cm)", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {recent.map((record) => (
              <tr key={record.id} className="text-slate-300">
                <td className="whitespace-nowrap px-2 py-2 font-medium text-white">
                  {formatMeasurementDateLabel(record.data)}
                </td>
                {MEASUREMENT_FIELDS.map((field) => (
                  <td key={field.key} className="px-2 py-2 tabular-nums">
                    {formatValue(record[field.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
