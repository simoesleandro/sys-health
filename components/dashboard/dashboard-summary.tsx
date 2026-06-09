import { BrandMetricCard } from "@/components/ui/brand-metric-card"
import {
  calculateBalance,
  formatBalance,
  getLatestMeasurement,
  getTodayAmazfitData,
  getTodayNutritionTotals,
} from "@/lib/data"
import { getUserNutritionGoals } from "@/lib/user-settings"

export async function DashboardSummary() {
  const [nutrition, amazfit, latest, goals] = await Promise.all([
    getTodayNutritionTotals(),
    getTodayAmazfitData(),
    getLatestMeasurement(),
    getUserNutritionGoals(),
  ])

  const balance = calculateBalance(
    nutrition.calorias,
    amazfit.caloriasGastas,
    goals.TMB_KCAL
  )
  const balanceLabel = formatBalance(
    nutrition.calorias,
    amazfit.caloriasGastas,
    goals.TMB_KCAL
  )
  const balanceAccent = balance > 0 ? "green" : balance < 0 ? "magenta" : "cyan"
  const caloriePct = Math.round(
    (nutrition.calorias / goals.TMB_KCAL) * 100
  )
  const proteinPct = Math.round(
    (nutrition.proteinas / goals.PROTEIN_G) * 100
  )
  const waterPct = Math.round(
    (nutrition.aguaLitros / goals.WATER_L) * 100
  )

  const pesoValue =
    latest.peso != null
      ? `${latest.peso.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`
      : "—"

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <BrandMetricCard
        label="Balanço Calórico"
        value={balanceLabel}
        meta={`${caloriePct}% da meta · TMB ${goals.TMB_KCAL.toLocaleString("pt-BR")} kcal`}
        accent={balanceAccent}
        progress={caloriePct}
      />
      <BrandMetricCard
        label="Peso"
        value={pesoValue}
        meta={latest.dataLabel ?? "Sem medição recente"}
        accent="blue"
      />
      <BrandMetricCard
        label="Proteína"
        value={`${Math.round(nutrition.proteinas)}g`}
        meta={`${proteinPct}% da meta · ${goals.PROTEIN_G}g`}
        accent="magenta"
        progress={proteinPct}
      />
      <BrandMetricCard
        label="Hidratação"
        value={`${nutrition.aguaLitros.toFixed(1)}L`}
        meta={`${waterPct}% da meta · ${goals.WATER_L}L`}
        accent="purple"
        progress={waterPct}
      />
    </div>
  )
}
