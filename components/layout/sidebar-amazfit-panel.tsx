import {
  formatSleepMinutes,
  getTodayAmazfitData,
  getYesterdayAmazfitData,
} from "@/lib/data"
import { NeonCard } from "@/components/ui/neon-card"

function AmazfitMetric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-black/30 px-2 py-1.5">
      <p className="text-[9px] tracking-wider text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-white">{value}</p>
      {hint ? (
        <p className="mt-0.5 text-[9px] text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export async function SidebarAmazfitPanel() {
  const [amazfit, yesterday] = await Promise.all([
    getTodayAmazfitData(),
    getYesterdayAmazfitData(),
  ])

  const sleepMin =
    amazfit.sonoTotalMin > 0 ? amazfit.sonoTotalMin : yesterday.sonoTotalMin
  const sleepHint =
    amazfit.sonoTotalMin <= 0 && yesterday.sonoTotalMin > 0
      ? "noite anterior"
      : undefined

  return (
    <NeonCard accent="cyan" glow={false} className="min-w-0 shrink-0 p-3">
      <p className="neon-label text-brand-cyan">Amazfit hoje</p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <AmazfitMetric
          label="Passos"
          value={amazfit.passos.toLocaleString("pt-BR")}
        />
        <AmazfitMetric
          label="Sono"
          value={formatSleepMinutes(sleepMin)}
          hint={sleepHint}
        />
        <AmazfitMetric label="HRV" value={`${amazfit.hrvMs} ms`} />
        <AmazfitMetric label="PAI" value={String(amazfit.pai)} />
      </div>

      {!amazfit.synced && (
        <p className="mt-2 text-[10px] text-slate-500">
          Sem sync hoje — balanço usa apenas TMB
        </p>
      )}
    </NeonCard>
  )
}
