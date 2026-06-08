import { EvolutionCharts } from "@/components/dashboard/evolution-charts"
import { SectionHeader } from "@/components/layout/section-header"
import { getBodyCompositionDeltas } from "@/lib/body-composition"
import {
  getTodayNutritionTotals,
  getWearableTrends14Days,
  getWeightHistory,
} from "@/lib/data"

export async function ChartsSection({ showHeader = true }: { showHeader?: boolean }) {
  const [weightHistory, wearableData, nutrition, bodyComposition] =
    await Promise.all([
      getWeightHistory(),
      getWearableTrends14Days(),
      getTodayNutritionTotals(),
      getBodyCompositionDeltas(),
    ])

  return (
    <section className="flex flex-col gap-4">
      {showHeader ? (
        <SectionHeader
          title="Evolução"
          subtitle="Peso histórico completo e macros"
        />
      ) : null}

      <EvolutionCharts
        weightData={weightHistory.points}
        weightStart={weightHistory.start}
        wearableData={wearableData}
        bodyComposition={bodyComposition}
        macros={{
          proteinas: nutrition.proteinas,
          carboidratos: nutrition.carboidratos,
          gorduras: nutrition.gorduras,
        }}
      />
    </section>
  )
}
