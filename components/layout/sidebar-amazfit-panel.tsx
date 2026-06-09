import { formatSleepMinutes, getTodayAmazfitData } from "@/lib/data"
import { NeonCard } from "@/components/ui/neon-card"

function AmazfitMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-black/30 px-2 py-1.5">
      <p className="text-[9px] tracking-wider text-slate-500 uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-white">{value}</p>
    </div>
  )
}

export async function SidebarAmazfitPanel() {
  const amazfit = await getTodayAmazfitData()

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
          value={formatSleepMinutes(amazfit.sonoTotalMin)}
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
