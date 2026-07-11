"use client"

import * as React from "react"
import { Loader2, Sparkles } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createFood, updateFood } from "@/lib/actions/foods"
import {
  FOOD_REFERENCE_UNITS,
  type FavoriteFood,
  type FoodFormInput,
  type FoodReferenceUnit,
} from "@/lib/foods"
import { cn } from "@/lib/utils"

const EMPTY_FORM: FoodFormInput = {
  descricao: "",
  categoria: "Lanche",
  calorias: 0,
  proteinas: 0,
  carboidratos: 0,
  gorduras: 0,
  qtdReferencia: 100,
  unidadeReferencia: "g",
}

function foodToForm(food: FavoriteFood): FoodFormInput {
  return {
    descricao: food.descricao,
    categoria: food.categoria,
    calorias: food.calorias,
    proteinas: food.proteinas,
    carboidratos: food.carboidratos,
    gorduras: food.gorduras,
    qtdReferencia: food.qtdReferencia,
    unidadeReferencia: food.unidadeReferencia,
  }
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMacroValue(value: number, unit = "") {
  const rounded = Math.round(value * 10) / 10
  const formatted = Number.isInteger(rounded) ? Math.round(rounded) : rounded

  return `${formatted}${unit}`
}

const MACRO_PREVIEW_ITEMS = [
  { key: "calorias", label: "Kcal", unit: "" },
  { key: "proteinas", label: "Prot", unit: "g" },
  { key: "carboidratos", label: "Carb", unit: "g" },
  { key: "gorduras", label: "Gord", unit: "g" },
] as const

const MACRO_PREVIEW_ACCENTS = [
  "border-brand-cyan/35 bg-brand-cyan/10",
  "border-brand-green/35 bg-brand-green/10",
  "border-brand-blue/35 bg-brand-blue/10",
  "border-brand-magenta/35 bg-brand-magenta/10",
] as const

const PORTION_PRESETS = [
  { label: "100g", qtdReferencia: 100, unidadeReferencia: "g" },
  { label: "1 und", qtdReferencia: 1, unidadeReferencia: "und" },
  { label: "1 scoop", qtdReferencia: 30, unidadeReferencia: "g" },
  { label: "1 colher", qtdReferencia: 15, unidadeReferencia: "g" },
] as const

export function FoodFormModal({
  open,
  onOpenChange,
  food,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  food: FavoriteFood | null
  onSaved: (message: string) => void
}) {
  const isEditing = food != null
  const [form, setForm] = React.useState<FoodFormInput>(EMPTY_FORM)
  const [error, setError] = React.useState<string | null>(null)
  const [hint, setHint] = React.useState<string | null>(null)
  const [isAnalyzing, startAnalyzeTransition] = React.useTransition()
  const [isSaving, startSaveTransition] = React.useTransition()

  React.useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(food ? foodToForm(food) : EMPTY_FORM)
    setError(null)
    setHint(null)
  }, [open, food])

  function updateField<K extends keyof FoodFormInput>(
    key: K,
    value: FoodFormInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
    setError(null)
    setHint(null)
  }

  function applyPortionPreset(preset: {
    qtdReferencia: number
    unidadeReferencia: FoodReferenceUnit
  }) {
    setForm((current) => ({
      ...current,
      qtdReferencia: preset.qtdReferencia,
      unidadeReferencia: preset.unidadeReferencia,
    }))
    setError(null)
    setHint(null)
  }

  function handleAnalyzeFood() {
    const descricao = form.descricao.trim()
    if (descricao.length < 2) {
      setError("Informe o nome do alimento antes de estimar.")
      return
    }

    setError(null)
    setHint(null)
    startAnalyzeTransition(async () => {
      try {
        const response = await fetch("/api/foods/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descricao,
            qtdReferencia: form.qtdReferencia,
            unidadeReferencia: form.unidadeReferencia,
          }),
        })
        const data = (await response.json()) as {
          error?: string
          food?: FoodFormInput
        }

        if (!response.ok || !data.food) {
          setError(data.error ?? "Não foi possível estimar este alimento.")
          return
        }

        setForm(data.food)
        setHint("Estimativa aplicada. Revise os valores antes de salvar.")
      } catch {
        setError("Falha de rede ao contactar a IA.")
      }
    })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    startSaveTransition(async () => {
      const result = isEditing
        ? await updateFood(food.id, form)
        : await createFood(form)

      if (!result.success) {
        setError(result.error)
        return
      }

      onSaved(
        isEditing
          ? "Alimento atualizado no banco."
          : "Alimento salvo no banco."
      )
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-x-3 top-[4dvh] flex max-h-[92dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-brand-cyan/25 bg-zinc-950 p-0 shadow-2xl shadow-brand-cyan/10 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[86vh] sm:w-full sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-brand-cyan/20 bg-gradient-to-br from-cyan-950/45 via-zinc-950 to-purple-950/25 px-4 py-3">
          <DialogTitle className="text-white">
            {isEditing ? "Editar alimento" : "Adicionar alimento"}
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Cadastre a porção base e revise os macros antes de salvar.
          </DialogDescription>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {MACRO_PREVIEW_ITEMS.map((item, index) => (
              <div
                key={item.key}
                className={cn(
                  "min-w-0 rounded-lg border px-3 py-2 shadow-sm",
                  MACRO_PREVIEW_ACCENTS[index]
                )}
              >
                <span className="block text-[10px] font-medium uppercase text-slate-400">
                  {item.label}
                </span>
                <span className="block truncate text-base font-semibold tabular-nums text-white">
                  {formatMacroValue(form[item.key], item.unit)}
                </span>
              </div>
            ))}
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-cyan-950/20 px-4 py-4">
            <section className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="food-nome">Nome</Label>
                <Input
                  id="food-nome"
                  value={form.descricao}
                  onChange={(event) =>
                    updateField("descricao", event.target.value)
                  }
                  placeholder="Ex.: Peito de frango grelhado"
                  className="border-white/10 bg-black/35 focus-visible:ring-brand-cyan/50"
                  required
                />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAnalyzeFood}
                disabled={isAnalyzing || form.descricao.trim().length < 2}
                className="justify-center border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/15"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Estimando macros...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Preencher com IA
                  </>
                )}
              </Button>
            </section>

            <section className="flex flex-col gap-3 rounded-lg border border-brand-blue/20 bg-brand-blue/5 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="food-porcao-qtd">Porção base</Label>
                <span className="text-xs text-muted-foreground">
                  usada pela IA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Input
                    id="food-porcao-qtd"
                    type="number"
                    min={0.1}
                    step="any"
                    value={form.qtdReferencia}
                    onChange={(event) =>
                      updateField(
                        "qtdReferencia",
                        parseNumber(event.target.value)
                      )
                    }
                    className="border-white/10 bg-black/35 focus-visible:ring-brand-cyan/50"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Select
                    value={form.unidadeReferencia}
                    onValueChange={(value) =>
                      updateField(
                        "unidadeReferencia",
                        value as FoodReferenceUnit
                      )
                    }
                  >
                    <SelectTrigger
                      id="food-porcao-unidade"
                      className="w-full border-white/10 bg-black/35 focus:ring-brand-cyan/50"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOOD_REFERENCE_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PORTION_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-white/10 bg-black/25 text-xs text-slate-200 hover:border-brand-cyan/40 hover:bg-brand-cyan/10"
                    onClick={() => applyPortionPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="food-categoria">Categoria</Label>
                <Input
                  id="food-categoria"
                  value={form.categoria}
                  onChange={(event) =>
                    updateField("categoria", event.target.value)
                  }
                  placeholder="Lanche"
                  className="border-white/10 bg-black/35 focus-visible:ring-brand-cyan/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="food-kcal">Kcal</Label>
                  <Input
                    id="food-kcal"
                    type="number"
                    min={0}
                    step="any"
                    value={form.calorias}
                    onChange={(event) =>
                      updateField("calorias", parseNumber(event.target.value))
                    }
                    className="border-white/10 bg-black/35 focus-visible:ring-brand-cyan/50"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="food-prot">Proteína</Label>
                  <Input
                    id="food-prot"
                    type="number"
                    min={0}
                    step="any"
                    value={form.proteinas}
                    onChange={(event) =>
                      updateField("proteinas", parseNumber(event.target.value))
                    }
                    className="border-white/10 bg-black/35 focus-visible:ring-brand-cyan/50"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="food-carb">Carbo</Label>
                  <Input
                    id="food-carb"
                    type="number"
                    min={0}
                    step="any"
                    value={form.carboidratos}
                    onChange={(event) =>
                      updateField(
                        "carboidratos",
                        parseNumber(event.target.value)
                      )
                    }
                    className="border-white/10 bg-black/35 focus-visible:ring-brand-cyan/50"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="food-gord">Gordura</Label>
                  <Input
                    id="food-gord"
                    type="number"
                    min={0}
                    step="any"
                    value={form.gorduras}
                    onChange={(event) =>
                      updateField("gorduras", parseNumber(event.target.value))
                    }
                    className="border-white/10 bg-black/35 focus-visible:ring-brand-cyan/50"
                  />
                </div>
              </div>
            </section>

            {error ? (
              <p
                className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            {hint ? (
              <p
                className="rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-2 text-sm text-brand-cyan"
                role="status"
              >
                {hint}
              </p>
            ) : null}
          </div>

          <DialogFooter className="shrink-0 gap-2 border-t border-brand-cyan/15 bg-black/55 px-4 py-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isAnalyzing}
              className="w-full border-white/10 bg-black/30 text-slate-200 hover:bg-white/5 sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isAnalyzing}
              className="w-full bg-brand-cyan text-black hover:bg-brand-cyan/90 sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alimento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
