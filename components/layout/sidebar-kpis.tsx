import {
  formatKpiValues,
  getTodayAmazfitData,
  getTodayNutritionTotals,
} from "@/lib/data"
import { neonCardClasses, NEON_ACCENTS } from "@/lib/neon-theme"
import { getUserNutritionGoals } from "@/lib/user-settings"
import { cn } from "@/lib/utils"

const KPI_ACCENTS = ["cyan", "magenta", "purple", "green"] as const

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: (typeof KPI_ACCENTS)[number]
}) {
  const styles = NEON_ACCENTS[accent]

  return (
    <div className={cn(neonCardClasses(accent), "px-2.5 py-2")}>
      <p className="neon-label text-[9px]">{label}</p>
      <p className={cn("mt-1 text-sm font-bold", styles.text)}>{value}</p>
    </div>
  )
}

export async function SidebarKpis() {
  const [totals, amazfit, goals] = await Promise.all([
    getTodayNutritionTotals(),
    getTodayAmazfitData(),
    getUserNutritionGoals(),
  ])
  const kpi = formatKpiValues(totals, amazfit, goals)
  const values = [kpi.calorias, kpi.proteina, kpi.agua, kpi.balanco]
  const labels = ["Calorias", "Proteína", "Água", "Balanço"]

  return (
    <div className="grid min-w-0 grid-cols-2 gap-2 px-1">
      {labels.map((label, index) => (
        <KpiCard
          key={label}
          label={label}
          value={values[index]}
          accent={KPI_ACCENTS[index]}
        />
      ))}
    </div>
  )
}
