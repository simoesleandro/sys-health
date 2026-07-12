"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { saveMeasurement } from "@/lib/actions/biometry"
import {
  MEASUREMENT_FIELDS,
  type MeasurementInput,
} from "@/lib/biometry"

function parseOptionalNumber(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

function formatInputValue(value: number | null) {
  return value == null ? "" : String(value)
}

export function BiometryModal({ initialForm }: { initialForm: MeasurementInput }) {
  const router = useRouter()
  const { setBiometryOpen, showFeedback } = useQuickModals()
  const [form, setForm] = React.useState(initialForm)
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, startSaveTransition] = React.useTransition()

  function handleClose() {
    setBiometryOpen(false)
  }

  function updateField(key: keyof MeasurementInput, value: string) {
    setForm((current) => ({
      ...current,
      [key]: parseOptionalNumber(value),
    }))
    setError(null)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    startSaveTransition(async () => {
      const result = await saveMeasurement(form)
      if (!result.success) {
        setError(result.error)
        return
      }
      showFeedback("Medidas salvas.")
      handleClose()
      router.refresh()
    })
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent
        className="fixed inset-x-3 top-[8dvh] flex max-h-[85dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-brand-blue/25 bg-zinc-950 p-0 shadow-2xl shadow-brand-blue/10 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-none sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="border-b border-brand-blue/20 bg-gradient-to-br from-blue-950/45 via-zinc-950 to-cyan-950/25 px-4 py-4">
          <DialogTitle className="text-white">Biometria</DialogTitle>
          <DialogDescription className="text-slate-300">
            Registre ou atualize as medidas de hoje (horário de Brasília).
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-blue-950/20 px-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {MEASUREMENT_FIELDS.map((field) => (
                <div key={field.key} className="flex flex-col gap-2">
                  <Label htmlFor={`biometry-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`biometry-${field.key}`}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={formatInputValue(form[field.key])}
                    onChange={(event) =>
                      updateField(field.key, event.target.value)
                    }
                    disabled={isSaving}
                    className="border-white/10 bg-black/35 focus-visible:ring-brand-blue/50"
                  />
                </div>
              ))}
            </div>

            {error ? (
              <p
                className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 border-t border-brand-blue/20 bg-black/35 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:gap-2 sm:px-5 sm:pb-5">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
              className="border-white/10 bg-black/30 text-slate-200 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                "Salvar medidas"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
