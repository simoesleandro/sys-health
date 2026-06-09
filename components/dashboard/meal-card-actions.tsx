"use client"

import { useQuickModals } from "@/components/modals/quick-modals-context"
import { deleteMealFromForm } from "@/lib/actions/meals"

export function MealCardActions({
  mealId,
  categoria,
}: {
  mealId: number
  categoria: string
}) {
  const { openEditMeal } = useQuickModals()

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={() => openEditMeal(mealId)}
        className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-zinc-900/60 hover:text-brand-cyan"
      >
        Editar
      </button>
      <form action={deleteMealFromForm}>
        <input type="hidden" name="mealId" value={mealId} />
        <button
          type="submit"
          className="rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-zinc-900/60 hover:text-red-400"
          aria-label={`Apagar refeição ${categoria}`}
        >
          Apagar
        </button>
      </form>
    </div>
  )
}
