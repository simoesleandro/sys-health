"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

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
} from "@/lib/foods"

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

export function FoodFormModal({
  open,
  onOpenChange,
  food,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  food: FavoriteFood | null
  onSaved: () => void
}) {
  const isEditing = food != null
  const [form, setForm] = React.useState<FoodFormInput>(EMPTY_FORM)
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, startSaveTransition] = React.useTransition()

  React.useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(food ? foodToForm(food) : EMPTY_FORM)
    setError(null)
  }, [open, food])

  function updateField<K extends keyof FoodFormInput>(
    key: K,
    value: FoodFormInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }))
    setError(null)
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

      onSaved()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar alimento" : "Adicionar alimento"}
          </DialogTitle>
          <DialogDescription>
            Valores nutricionais referentes à porção indicada (ex.: 100g).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="food-nome">Nome</Label>
            <Input
              id="food-nome"
              value={form.descricao}
              onChange={(event) => updateField("descricao", event.target.value)}
              placeholder="Ex.: Peito de frango grelhado"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="food-categoria">Categoria</Label>
            <Input
              id="food-categoria"
              value={form.categoria}
              onChange={(event) => updateField("categoria", event.target.value)}
              placeholder="Lanche"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="food-porcao-qtd">Porção (qtd)</Label>
              <Input
                id="food-porcao-qtd"
                type="number"
                min={0.1}
                step="any"
                value={form.qtdReferencia}
                onChange={(event) =>
                  updateField("qtdReferencia", parseNumber(event.target.value))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="food-porcao-unidade">Unidade</Label>
              <Select
                value={form.unidadeReferencia}
                onValueChange={(value) =>
                  updateField("unidadeReferencia", value)
                }
              >
                <SelectTrigger id="food-porcao-unidade" className="w-full">
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
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="food-prot">Proteína (g)</Label>
              <Input
                id="food-prot"
                type="number"
                min={0}
                step="any"
                value={form.proteinas}
                onChange={(event) =>
                  updateField("proteinas", parseNumber(event.target.value))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="food-carb">Carbo (g)</Label>
              <Input
                id="food-carb"
                type="number"
                min={0}
                step="any"
                value={form.carboidratos}
                onChange={(event) =>
                  updateField("carboidratos", parseNumber(event.target.value))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="food-gord">Gordura (g)</Label>
              <Input
                id="food-gord"
                type="number"
                min={0}
                step="any"
                value={form.gorduras}
                onChange={(event) =>
                  updateField("gorduras", parseNumber(event.target.value))
                }
              />
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
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
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
