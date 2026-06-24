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
        "flex w-full min-w-0 flex-col gap-1 rounded-lg border border-zinc-800/60",
        "bg-zinc-950/40 px-3 py-3 text-left transition-colors",
        "hover:border-cyan/30 hover:bg-cyan/5"
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
        className="flex max-h-[85vh] w-[calc(100%-2rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-zinc-800/60 px-4 py-4 pr-12">
          <DialogTitle>Editar refeições</DialogTitle>
          <DialogDescription>
            Selecione a refeição de hoje que deseja editar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
          {isLoading && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Carregando...
            </p>
          )}

          {!isLoading && meals.length === 0 && (
            <p className="text-sm text-muted-foreground">
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
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
