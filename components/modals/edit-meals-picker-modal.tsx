"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useEditMealModal,
  useEditMealsPickerModal,
} from "@/components/modals/quick-modals-context"
import {
  fetchTodayMealsForPicker,
  type MealPickerItem,
} from "@/lib/actions/meals"
import { cn } from "@/lib/utils"

function MealPickerRow({
  meal,
  onSelect,
}: {
  meal: MealPickerItem
  onSelect: (mealId: number) => void
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full min-w-0 flex-col gap-1 rounded-lg border border-white/10",
        "bg-black/25 px-3 py-3 text-left transition-colors",
        "hover:border-brand-cyan/35 hover:bg-brand-cyan/10"
      )}
      onClick={() => onSelect(meal.id)}
    >
      <span className="font-mono text-xs font-semibold text-brand-cyan">
        {meal.hora} · {meal.categoria}
      </span>
      <span className="line-clamp-2 text-sm leading-snug text-slate-300">
        {meal.descricao}
      </span>
    </button>
  )
}

export function EditMealsPickerModal() {
  const { open, setOpen } = useEditMealsPickerModal()
  const { openEditMeal } = useEditMealModal()
  const [meals, setMeals] = React.useState<MealPickerItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return

    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    setError(null)

    fetchTodayMealsForPicker()
      .then((items) => {
        if (!cancelled) setMeals(items)
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar as refeições.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  function handleSelect(mealId: number) {
    setOpen(false)
    openEditMeal(mealId)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setMeals([])
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed inset-x-3 top-[8dvh] flex max-h-[85dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-brand-cyan/25 bg-zinc-950 p-0 shadow-2xl shadow-brand-cyan/10 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-brand-cyan/20 bg-gradient-to-br from-cyan-950/45 via-zinc-950 to-purple-950/25 px-4 py-4 pr-12">
          <DialogTitle className="text-white">Editar refeições</DialogTitle>
          <DialogDescription className="text-slate-300">
            Selecione a refeição de hoje que deseja editar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-cyan-950/20 px-4 py-4">
          {isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Carregando...
            </p>
          )}

          {!isLoading && meals.length === 0 && (
            <p className="rounded-lg border border-dashed border-brand-cyan/25 bg-brand-cyan/5 px-3 py-4 text-sm text-muted-foreground">
              Nenhuma refeição registrada hoje.
            </p>
          )}

          {!isLoading &&
            meals.map((meal) => (
              <MealPickerRow
                key={meal.id}
                meal={meal}
                onSelect={handleSelect}
              />
            ))}

          {error && (
            <p
              className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
