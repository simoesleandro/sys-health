"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"

export function SupplementModal() {
  const router = useRouter()
  const { supplementOpen, setSupplementOpen, supplementPresets, showFeedback } =
    useQuickModals()
  const [selected, setSelected] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  const selectedSummary = React.useMemo(() => {
    const selectedSet = new Set(selected)
    const presets = supplementPresets.filter((preset) =>
      selectedSet.has(preset.id)
    )

    return presets.reduce(
      (acc, preset) => ({
        count: acc.count + 1,
        calorias: acc.calorias + Number(preset.calorias ?? 0),
        proteinas: acc.proteinas + Number(preset.proteinas ?? 0),
      }),
      { count: 0, calorias: 0, proteinas: 0 }
    )
  }, [selected, supplementPresets])

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
      showFeedback(
        `${selected.length} ${selected.length === 1 ? "suplemento registrado" : "suplementos registrados"}.`
      )
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={supplementOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed inset-x-3 top-[8dvh] flex max-h-[85dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-brand-green/25 bg-zinc-950 p-0 shadow-2xl shadow-brand-green/10 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="border-b border-brand-green/20 bg-gradient-to-br from-emerald-950/45 via-zinc-950 to-cyan-950/25 px-4 py-4">
          <div className="flex items-start justify-between gap-3 pr-7">
            <div>
              <DialogTitle className="text-white">Suplementação</DialogTitle>
              <DialogDescription className="text-slate-300">
                Marque um ou mais suplementos e registre de uma vez.
              </DialogDescription>
            </div>
            <div className="shrink-0 rounded-lg border border-brand-green/30 bg-brand-green/10 px-2.5 py-1.5 text-right shadow-sm shadow-brand-green/10">
              <span className="block text-[10px] font-medium uppercase text-brand-green">
                Itens
              </span>
              <span className="text-sm font-semibold tabular-nums text-white">
                {selectedSummary.count}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-emerald-950/20 px-4 py-4 sm:px-5">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {supplementPresets.map((preset) => {
              const isSelected = selected.includes(preset.id)
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => togglePreset(preset.id)}
                  className={cn(
                    "group min-h-16 rounded-lg border px-3 py-3 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/50",
                    isSelected
                      ? "border-brand-green/55 bg-brand-green/10 shadow-sm shadow-brand-green/10"
                      : "border-white/10 bg-black/25 hover:border-brand-green/30 hover:bg-brand-green/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug text-white">
                      {preset.label}
                    </p>
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs transition-colors",
                        isSelected
                          ? "border-brand-green/60 bg-brand-green/20 text-brand-green"
                          : "border-white/10 bg-black/35 text-slate-600 group-hover:border-brand-green/35 group-hover:text-brand-green/70"
                      )}
                      aria-hidden
                    >
                      {isSelected ? <Check className="size-3.5" /> : null}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Math.round(preset.calorias)} kcal · P{" "}
                    {Math.round(preset.proteinas)}g
                  </p>
                </button>
              )
            })}
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

        <DialogFooter className="shrink-0 flex-col gap-3 border-t border-brand-green/20 bg-black/35 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pb-5">
          <p className="w-full rounded-lg border border-brand-green/25 bg-brand-green/10 px-3 py-2 text-xs text-slate-300 sm:mr-auto sm:w-auto">
            <span className="font-medium text-foreground">
              {selectedSummary.count} selecionado(s)
            </span>{" "}
            · {Math.round(selectedSummary.calorias)} kcal · P{" "}
            {Math.round(selectedSummary.proteinas)}g
          </p>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || selected.length === 0}
            className="w-full bg-brand-green text-black hover:bg-brand-green/90 sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando…
              </>
            ) : (
              selected.length > 0
                ? `Registrar ${selected.length} selecionado(s)`
                : "Selecionar suplementos"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
