"use client"

import { useEffect, useMemo, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  createSupplementFromProduct,
  updateSupplementProduct,
} from "@/lib/actions/settings"
import {
  buildSupplementConfigsFromProduct,
  detectSupplementKind,
  getSupplementDisplayName,
} from "@/lib/supplements"
import type { UserSupplementConfig } from "@/lib/user-settings"

const EMPTY_FORM = {
  nome: "",
  marca: "",
  ativo: true,
}

export function SupplementFormModal({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: UserSupplementConfig | null
  onSaved: () => void
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const preview = useMemo(() => {
    if (!form.nome.trim()) return null
    const generated = buildSupplementConfigsFromProduct(form.nome, form.marca, {
      existingPresetIds: [],
      sortOrder: 0,
    })
    if (!generated.length) return null
    const kind = detectSupplementKind(form.nome)
    return {
      kind,
      slots: generated,
    }
  }, [form.nome, form.marca])

  useEffect(() => {
    if (!open) return
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        nome: getSupplementDisplayName(editing),
        marca: editing.marca,
        ativo: editing.ativo,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError(null)
  }, [open, editing])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = editing
        ? await updateSupplementProduct(editing.dbId, form)
        : await createSupplementFromProduct(form)

      if (!result.success) {
        setError(result.error)
        return
      }

      onSaved()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-x-3 top-[4dvh] flex max-h-[92dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-brand-green/25 bg-zinc-950 p-0 shadow-2xl shadow-brand-green/10 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[86vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-brand-green/20 bg-gradient-to-br from-emerald-950/45 via-zinc-950 to-cyan-950/25 px-4 py-3">
          <DialogTitle className="text-white">
            {editing ? "Editar suplemento" : "Novo suplemento"}
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Produto, marca e dose são usados para montar o painel de hoje.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-emerald-950/20 px-4 py-4">
            <p className="rounded-lg border border-brand-green/25 bg-brand-green/10 px-3 py-2 text-sm text-slate-300">
              Informe só o produto e a marca. Dose, macros, cores e doses por
              dia são preenchidos automaticamente.
            </p>

            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome do produto</Label>
              <Input
                id="nome"
                name="nome"
                value={form.nome}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex.: Whey Protein Isolado, Creatina, Ômega 3..."
                className="border-white/10 bg-black/35 focus-visible:ring-brand-green/50"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                name="marca"
                value={form.marca}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, marca: e.target.value }))
                }
                placeholder="Ex.: Dux, Max Titanium..."
                className="border-white/10 bg-black/35 focus-visible:ring-brand-green/50"
                required
              />
            </div>

            {preview ? (
              <div className="rounded-lg border border-brand-green/25 bg-brand-green/5 px-3 py-3 text-sm text-slate-300">
                <p className="font-medium text-white">
                  Pré-visualização automática
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-xs text-slate-400">
                  {preview.slots.map((slot) => (
                    <li key={slot.presetId}>
                      {slot.dose} · {slot.calorias} kcal · P {slot.proteinas}g
                    </li>
                  ))}
                </ul>
                {preview.kind.startsWith("whey") ? (
                  <p className="mt-2 text-xs text-brand-green">
                    Whey: 2 doses/dia criadas automaticamente.
                  </p>
                ) : null}
              </div>
            ) : null}

            <label
              htmlFor="supplement-active"
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300"
            >
              <Checkbox
                id="supplement-active"
                name="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, ativo: checked === true }))
                }
              />
              Ativo no painel de hoje
            </label>

            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 border-t border-brand-green/20 bg-black/35 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Salvando..." : "Salvar suplemento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
