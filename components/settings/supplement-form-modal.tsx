"use client"

import { useEffect, useState, useTransition } from "react"

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
  createSupplementConfig,
  updateSupplementConfig,
} from "@/lib/actions/settings"
import type { SupplementTheme } from "@/lib/supplements"
import type { UserSupplementConfig } from "@/lib/user-settings"

const THEME_OPTIONS: SupplementTheme[] = [
  "green",
  "cyan",
  "yellow",
  "magenta",
  "purple",
  "orange",
]

const EMPTY_FORM = {
  presetId: "",
  nome: "",
  marca: "",
  dose: "",
  corTema: "cyan" as SupplementTheme,
  label: "",
  descricao: "",
  calorias: 0,
  proteinas: 0,
  carboidratos: 0,
  gorduras: 0,
  sortOrder: 0,
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

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        presetId: editing.id,
        nome: editing.nome,
        marca: editing.marca,
        dose: editing.dose,
        corTema: editing.cor_tema,
        label: editing.label,
        descricao: editing.descricao,
        calorias: editing.calorias,
        proteinas: editing.proteinas,
        carboidratos: editing.carboidratos,
        gorduras: editing.gorduras,
        sortOrder: editing.sortOrder,
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
        ? await updateSupplementConfig(editing.dbId, form)
        : await createSupplementConfig(form)

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

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="presetId">ID (slug)</Label>
              <Input
                id="presetId"
                value={form.presetId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, presetId: e.target.value }))
                }
                disabled={Boolean(editing)}
                placeholder="ex: creatina"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Ordem</Label>
              <Input
                id="sortOrder"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nome: e.target.value }))
                }
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dose">Dose</Label>
              <Input
                id="dose"
                value={form.dose}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dose: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="corTema">Tema</Label>
              <select
                id="corTema"
                value={form.corTema}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    corTema: e.target.value as SupplementTheme,
                  }))
                }
                className="flex h-9 w-full rounded-md border border-zinc-800/70 bg-black/40 px-3 text-sm"
              >
                {THEME_OPTIONS.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Rótulo (registro)</Label>
            <Input
              id="label"
              value={form.label}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, label: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={form.descricao}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, descricao: e.target.value }))
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["calorias", "kcal"],
                ["proteinas", "prot"],
                ["carboidratos", "carb"],
                ["gorduras", "gord"],
              ] as const
            ).map(([key, short]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{short}</Label>
                <Input
                  id={key}
                  type="number"
                  min={0}
                  step="0.1"
                  value={form[key]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [key]: Number(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </div>

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
