"use client"

import { Droplets, Ruler, UtensilsCrossed } from "lucide-react"

import { useQuickModals } from "@/components/modals/quick-modals-context"
import { Button } from "@/components/ui/button"
import { NeonCard } from "@/components/ui/neon-card"

type TodayActionPanelProps = {
  caloriesRemaining: number
  proteinRemaining: number
  waterRemainingLiters: number
  hasRecentMeasurement: boolean
}

export function TodayActionPanel({
  caloriesRemaining,
  proteinRemaining,
  waterRemainingLiters,
  hasRecentMeasurement,
}: TodayActionPanelProps) {
  const { openMealModal, openWaterModal, openBiometryModal } = useQuickModals()
  const waterMl = Math.round(waterRemainingLiters * 1000)
  const hasNutritionGap = caloriesRemaining > 150 || proteinRemaining >= 15
  const hasWaterGap = waterMl >= 250

  if (!hasNutritionGap && !hasWaterGap && hasRecentMeasurement) {
    return null
  }

  return (
    <NeonCard accent="cyan" className="px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="neon-label">Próxima ação</p>
          <p className="mt-1 text-sm text-slate-400">
            Sugestões rápidas para fechar o dia com menos fricção.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {hasNutritionGap ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="justify-start border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/15"
              onClick={openMealModal}
            >
              <UtensilsCrossed className="size-4" />
              {proteinRemaining >= 15
                ? `Faltam ${Math.round(proteinRemaining)}g proteína`
                : `Faltam ${Math.round(caloriesRemaining)} kcal`}
            </Button>
          ) : null}

          {hasWaterGap ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="justify-start border-brand-purple/25 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/15"
              onClick={openWaterModal}
            >
              <Droplets className="size-4" />
              Registrar {waterMl}ml água
            </Button>
          ) : null}

          {!hasRecentMeasurement ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="justify-start border-brand-blue/25 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/15"
              onClick={openBiometryModal}
            >
              <Ruler className="size-4" />
              Registrar medidas
            </Button>
          ) : null}
        </div>
      </div>
    </NeonCard>
  )
}
