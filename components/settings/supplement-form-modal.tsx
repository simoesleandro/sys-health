"use client"

import { useEffect, useMemo, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar suplemento" : "Novo suplemento"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-400">
            Informe só o produto e a marca. Dose, macros, cores e doses por dia
            são preenchidos automaticamente.
          </p>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome do produto</Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nome: e.target.value }))
              }
              placeholder="Ex: Whey Protein Isolado, Creatina, Ômega 3"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              value={form.marca}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, marca: e.target.value }))
              }
              placeholder="Ex: Dux, Max Titanium"
              required
            />
          </div>

          {preview ? (
            <div className="rounded-lg border border-zinc-800/60 bg-black/30 px-3 py-3 text-sm text-slate-300">
              <p className="font-medium text-white">Pré-visualização automática</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                {preview.slots.map((slot) => (
                  <li key={slot.presetId}>
                    {slot.dose} · {slot.calorias} kcal · P {slot.proteinas}g
                  </li>
                ))}
              </ul>
              {preview.kind.startsWith("whey") ? (
                <p className="mt-2 text-xs text-brand-green">
                  Whey: 2 doses/dia (Scoop 1 e Scoop 2) criadas automaticamente.
                </p>
              ) : null}
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ativo: e.target.checked }))
              }
            />
            Ativo no painel de hoje
          </label>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
