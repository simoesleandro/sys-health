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
import { WATER_QUICK_VOLUMES_ML } from "@/lib/supplements"

export function WaterModal() {
  const { waterOpen, setWaterOpen, nutritionGoals, showFeedback } =
    useQuickModals()
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
      showFeedback(`${ml}ml de água registrados.`)
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
        className="fixed inset-x-3 top-[8dvh] flex max-h-[85dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-brand-blue/25 bg-zinc-950 p-0 shadow-2xl shadow-brand-blue/10 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-none sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="border-b border-brand-blue/20 bg-gradient-to-br from-blue-950/45 via-zinc-950 to-cyan-950/25 px-4 py-4">
          <DialogTitle className="text-white">Hidratação</DialogTitle>
          <DialogDescription className="text-slate-300">
            Registre o volume consumido. Meta diária: {nutritionGoals.WATER_L}L.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 bg-gradient-to-b from-zinc-950 via-zinc-950 to-blue-950/20 px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            {WATER_QUICK_VOLUMES_ML.map((ml) => (
              <Button
                key={ml}
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleAdd(ml)}
                className="border-brand-blue/25 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/15"
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
                name="customWaterMl"
                type="number"
                min="1"
                step="50"
                inputMode="numeric"
                value={customMl}
                onChange={(event) => setCustomMl(event.target.value)}
                className="border-white/10 bg-black/35 focus-visible:ring-brand-blue/50"
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
            <p
              className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-brand-blue/20 bg-black/35 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5">
          {isPending && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Salvando…
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
