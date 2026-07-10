"use client"

import { Plus } from "lucide-react"

import { useQuickModals } from "@/components/modals/quick-modals-context"
import { Button } from "@/components/ui/button"
import { NeonCard } from "@/components/ui/neon-card"

export function EmptyMealsCard() {
  const { openMealModal } = useQuickModals()

  return (
    <NeonCard accent="cyan" className="px-5 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="neon-section-title">Nenhuma refeição registrada hoje</p>
          <p className="neon-section-subtitle mt-2">
            Comece pelo registro rápido, favoritos ou análise com IA.
          </p>
        </div>
        <Button
          type="button"
          className="shrink-0 border-zinc-800/60 bg-black/50 text-brand-cyan hover:bg-zinc-900/60"
          onClick={openMealModal}
        >
          <Plus className="size-4" />
          Nova refeição
        </Button>
      </div>
    </NeonCard>
  )
}
