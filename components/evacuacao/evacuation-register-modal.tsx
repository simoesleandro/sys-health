"use client"

import * as React from "react"
import { Check, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { registerEvacuation } from "@/lib/actions/evacuation"
import { bristolNeonCardClasses } from "@/lib/bristol-theme"
import { BRISTOL_TYPES, type BristolType } from "@/lib/evacuation"
import { cn } from "@/lib/utils"

export function EvacuationRegisterModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [selectedType, setSelectedType] = React.useState<BristolType | null>(
    null
  )
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  function resetState() {
    setSelectedType(null)
    setError(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) resetState()
    onOpenChange(nextOpen)
  }

  function handleConfirm() {
    if (selectedType == null) {
      setError("Selecione um tipo Bristol antes de confirmar.")
      return
    }

    setError(null)

    startTransition(async () => {
      const result = await registerEvacuation(selectedType)

      if (!result.success) {
        setError(result.error)
        return
      }

      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed inset-x-3 top-[4dvh] flex max-h-[92dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-brand-green/25 bg-zinc-950 p-0 shadow-2xl shadow-brand-green/10 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[86vh] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-brand-green/20 bg-gradient-to-br from-emerald-950/45 via-zinc-950 to-cyan-950/25 px-4 py-3">
          <DialogTitle className="text-white">Registrar evacuação</DialogTitle>
          <DialogDescription className="text-slate-300">
            Selecione o tipo da escala de Bristol que melhor descreve o
            evacuamento de agora. Horário gravado em Brasília.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 grid-cols-1 gap-3 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-emerald-950/20 px-4 py-4 sm:grid-cols-2">
          {BRISTOL_TYPES.map((item) => {
            const isSelected = selectedType === item.tipo

            return (
              <button
                key={item.tipo}
                type="button"
                disabled={isPending}
                aria-pressed={isSelected}
                onClick={() => {
                  setError(null)
                  setSelectedType(item.tipo)
                }}
                className={cn(
                  "text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50",
                  isPending && !isSelected && "opacity-60"
                )}
              >
                <div
                  className={cn(
                    bristolNeonCardClasses(item.tipo),
                    "relative h-full cursor-pointer p-4 transition-all",
                    isSelected &&
                      "ring-2 ring-brand-cyan/70 ring-offset-2 ring-offset-zinc-950"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-white">{item.titulo}</p>
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs transition-colors",
                        isSelected
                          ? "border-brand-cyan/60 bg-brand-cyan/20 text-brand-cyan"
                          : "border-zinc-700/80 bg-black/40 text-slate-500"
                      )}
                      aria-hidden
                    >
                      {isSelected ? (
                        <Check className="size-3.5" />
                      ) : (
                        item.tipo
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {item.descricao}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t border-brand-green/20 bg-black/35 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pb-5">
          <div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <p className="text-sm text-slate-400">
            {selectedType
              ? `Tipo ${selectedType} selecionado`
              : "Nenhum tipo selecionado"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isPending || selectedType == null}
              onClick={handleConfirm}
              className="bg-brand-green font-semibold text-black hover:bg-brand-green/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Registrando…
                </>
              ) : (
                "Confirmar registro"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
