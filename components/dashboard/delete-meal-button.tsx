"use client"

import { useTransition } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { deleteMeal } from "@/lib/actions/meals"

export function DeleteMealButton({
  mealId,
  categoria,
}: {
  mealId: number
  categoria: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Apagar "${categoria}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    startTransition(async () => {
      const result = await deleteMeal(mealId)
      if (!result.success) {
        alert(result.error)
      }
    })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={`Apagar refeição ${categoria}`}
    >
      <Trash2 className="size-4" />
    </Button>
  )
}
