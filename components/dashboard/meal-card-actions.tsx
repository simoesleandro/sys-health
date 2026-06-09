"use client"

import { useQuickModals } from "@/components/modals/quick-modals-context"

export function MealCardActions({
  mealId,
  categoria,
  deleteFormAction,
}: {
  mealId: number
  categoria: string
  deleteFormAction: (formData: FormData) => Promise<void>
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
      <form action={deleteFormAction}>
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
