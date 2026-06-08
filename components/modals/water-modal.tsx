"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { useQuickModals } from "@/components/modals/quick-modals-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addWater } from "@/lib/actions/water"
import { NUTRITION_GOALS } from "@/lib/goals"
import { WATER_QUICK_VOLUMES_ML } from "@/lib/supplements"

export function WaterModal() {
  const { waterOpen, setWaterOpen } = useQuickModals()
  const [customMl, setCustomMl] = React.useState("300")
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  function handleOpenChange(nextOpen: boolean) {
    setWaterOpen(nextOpen)
    if (!nextOpen) {
      setCustomMl("300")
      setError(null)
    }
  }

  function handleAdd(ml: number) {
    setError(null)
    startTransition(async () => {
      const result = await addWater(ml)
      if (!result.success) {
        setError(result.error)
        return
      }
      handleOpenChange(false)
    })
  }

  function handleCustomAdd() {
    const ml = Number(customMl.replace(",", "."))
    if (!Number.isFinite(ml) || ml <= 0) {
      setError("Informe um volume válido em ml.")
      return
    }
    handleAdd(Math.round(ml))
  }

  return (
    <Dialog open={waterOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed inset-x-3 top-[8dvh] flex max-h-[85dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-none sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="border-b px-4 py-4">
          <DialogTitle>Hidratação</DialogTitle>
          <DialogDescription>
            Registre o volume consumido. Meta diária: {NUTRITION_GOALS.WATER_L}L.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            {WATER_QUICK_VOLUMES_ML.map((ml) => (
              <Button
                key={ml}
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() => handleAdd(ml)}
              >
                +{ml}ml
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="custom-water-ml">Outro volume (ml)</Label>
            <div className="flex gap-2">
              <Input
                id="custom-water-ml"
                type="number"
                min="1"
                step="50"
                value={customMl}
                onChange={(event) => setCustomMl(event.target.value)}
              />
              <Button
                type="button"
                disabled={isPending}
                onClick={handleCustomAdd}
              >
                Registrar
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0">
          {isPending && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Salvando...
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
