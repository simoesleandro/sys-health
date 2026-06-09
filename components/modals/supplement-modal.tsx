"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

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
import { registerSupplements } from "@/lib/actions/supplements"
import { SUPPLEMENT_PRESETS } from "@/lib/supplements"
import { cn } from "@/lib/utils"

export function SupplementModal() {
  const router = useRouter()
  const { supplementOpen, setSupplementOpen } = useQuickModals()
  const [selected, setSelected] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  function handleOpenChange(nextOpen: boolean) {
    setSupplementOpen(nextOpen)
    if (!nextOpen) {
      setSelected([])
      setError(null)
    }
  }

  function togglePreset(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
    setError(null)
  }

  function handleSave() {
    if (selected.length === 0) {
      setError("Selecione pelo menos um suplemento.")
      return
    }

    startTransition(async () => {
      const result = await registerSupplements(selected)
      if (!result.success) {
        setError(result.error)
        return
      }
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={supplementOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed inset-x-3 top-[8dvh] flex max-h-[85dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="border-b px-4 py-4">
          <DialogTitle>Suplementação</DialogTitle>
          <DialogDescription>
            Marque um ou mais suplementos e registre de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SUPPLEMENT_PRESETS.map((preset) => {
              const isSelected = selected.includes(preset.id)
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => togglePreset(preset.id)}
                  className={cn(
                    "rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                    isSelected
                      ? "border-cyan/50 bg-cyan/10"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <p className="font-medium">{preset.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Math.round(preset.calorias)} kcal · P{" "}
                    {Math.round(preset.proteinas)}g
                  </p>
                </button>
              )
            })}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || selected.length === 0}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              `Registrar ${selected.length} selecionado(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
