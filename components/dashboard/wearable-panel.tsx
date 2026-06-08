import { formatSleepMinutes, getTodayAmazfitData } from "@/lib/data"
import { NEON_ACCENTS } from "@/lib/neon-theme"
import type { NeonAccent } from "@/lib/neon-theme"
import { NeonCard } from "@/components/ui/neon-card"
import { cn } from "@/lib/utils"

const STATS: { label: string; accent: NeonAccent }[] = [
  { label: "Passos", accent: "cyan" },
  { label: "Sono", accent: "purple" },
  { label: "HRV", accent: "blue" },
  { label: "PAI", accent: "green" },
]

function WearableStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: NeonAccent
}) {
  const styles = NEON_ACCENTS[accent]

  return (
    <NeonCard accent={accent} className="px-4 py-3">
      <p className="neon-label">{label}</p>
      <p className={cn("mt-2 text-xl font-bold", styles.text)}>{value}</p>
    </NeonCard>
  )
}

export async function WearablePanel() {
  const amazfit = await getTodayAmazfitData()
  const values = [
    amazfit.passos.toLocaleString("pt-BR"),
    formatSleepMinutes(amazfit.sonoTotalMin),
    `${amazfit.hrvMs} ms`,
    String(amazfit.pai),
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {STATS.map((stat, index) => (
          <WearableStat
            key={stat.label}
            label={stat.label}
            value={values[index]}
            accent={stat.accent}
          />
        ))}
      </div>
      {!amazfit.synced && (
        <p className="text-xs text-slate-500">
          Sem sync Amazfit hoje — métricas zeradas até nova sincronização.
        </p>
      )}
    </div>
  )
}
