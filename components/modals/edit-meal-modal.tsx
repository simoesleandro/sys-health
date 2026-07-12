"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Minus, Plus, Trash2 } from "lucide-react"

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
import {
  useEditMealModal,
  useQuickModals,
} from "@/components/modals/quick-modals-context"
import { searchFoods } from "@/lib/actions/foods"
import { getMealForEdit, updateMeal } from "@/lib/actions/meals"
import {
  type CartItem,
  type FoodSearchResult,
  MEAL_CATEGORIES,
  calcItemMacros,
  cartToComponentes,
  foodToCartItem,
  sumCartMacros,
} from "@/lib/meals"
import { cn } from "@/lib/utils"

const EDIT_MACRO_SUMMARY_ITEMS = [
  { key: "calorias", label: "Kcal", unit: "" },
  { key: "proteinas", label: "Prot", unit: "g" },
  { key: "carboidratos", label: "Carb", unit: "g" },
  { key: "gorduras", label: "Gord", unit: "g" },
] as const

const EDIT_MACRO_SUMMARY_ACCENTS = [
  "border-brand-cyan/35 bg-brand-cyan/10",
  "border-brand-green/35 bg-brand-green/10",
  "border-brand-blue/35 bg-brand-blue/10",
  "border-brand-magenta/35 bg-brand-magenta/10",
] as const

function roundMacro(value: number) {
  return Math.round(value * 10) / 10
}

function formatMacroValue(value: number, unit: string) {
  const rounded = roundMacro(value)
  return `${Number.isInteger(rounded) ? Math.round(rounded) : rounded}${unit}`
}

function formatCartMacroSummary(item: CartItem) {
  const macros = calcItemMacros(item)

  return `${Math.round(macros.kcal)} kcal · P ${roundMacro(macros.prot)}g · C ${roundMacro(macros.carb)}g · G ${roundMacro(macros.gord)}g`
}

function normalizeUnit(value: string) {
  const unit = value.trim().toLowerCase()
  if (unit === "und" || unit === "un" || unit === "unidade") return "und"
  return unit
}

function getCartQuantityStep(item: CartItem) {
  const unit = normalizeUnit(item.unidade)
  if (unit === "und" || unit === "dose") return 1
  if (item.qtdRef >= 100) return 25
  if (item.qtdRef >= 30) return 10
  return 5
}

function clampCartQuantity(value: number, unit: string) {
  if (!Number.isFinite(value)) return 1
  const normalizedUnit = normalizeUnit(unit)
  const min = normalizedUnit === "und" || normalizedUnit === "dose" ? 1 : 0.5
  const rounded =
    normalizedUnit === "und" || normalizedUnit === "dose"
      ? Math.round(value)
      : value >= 20
        ? Math.round(value / 5) * 5
        : Math.round(value * 10) / 10

  return Math.max(min, rounded)
}

export function EditMealModal() {
  const router = useRouter()
  const { open, mealId, setOpen } = useEditMealModal()
  const { showFeedback } = useQuickModals()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<FoodSearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [pendingFood, setPendingFood] = React.useState<FoodSearchResult | null>(
    null
  )
  const [pendingQtd, setPendingQtd] = React.useState("")
  const [category, setCategory] = React.useState<string>("Almoço")
  const [error, setError] = React.useState<string | null>(null)
  const [isLoadingMeal, setIsLoadingMeal] = React.useState(false)
  const [isSaving, startSaveTransition] = React.useTransition()

  const totals = React.useMemo(() => sumCartMacros(cart), [cart])

  React.useEffect(() => {
    if (!open || mealId == null) return

    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoadingMeal(true)
    setError(null)

    getMealForEdit(mealId)
      .then((result) => {
        if (cancelled) return

        if (!result.success) {
          setError(result.error)
          setCart([])
          return
        }

        try {
          const parsed = JSON.parse(result.meal.cartJson) as CartItem[]
          setCart(Array.isArray(parsed) ? parsed : [])
          setCategory(result.meal.categoria)
        } catch {
          setError("Não foi possível ler os itens da refeição.")
          setCart([])
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMeal(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, mealId])

  React.useEffect(() => {
    if (!open) return

    const term = query.trim()
    if (term.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timer = window.setTimeout(() => {
      searchFoods(term)
        .then(setResults)
        .finally(() => setIsSearching(false))
    }, 300)

    return () => window.clearTimeout(timer)
  }, [query, open])

  function resetState() {
    setQuery("")
    setResults([])
    setCart([])
    setPendingFood(null)
    setPendingQtd("")
    setCategory("Almoço")
    setError(null)
    setIsLoadingMeal(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) resetState()
  }

  function handleSelectFood(food: FoodSearchResult) {
    setPendingFood(food)
    setPendingQtd(String(food.qtdReferencia))
    setError(null)
  }

  function handleConfirmAdd() {
    if (!pendingFood) return

    const qtd = Number(pendingQtd.replace(",", "."))
    if (!Number.isFinite(qtd) || qtd <= 0) {
      setError("Informe uma quantidade válida.")
      return
    }

    setCart((prev) => [...prev, foodToCartItem(pendingFood, qtd)])
    setPendingFood(null)
    setPendingQtd("")
    setQuery("")
    setResults([])
    setError(null)
  }

  function handleRemoveFromCart(uid: string) {
    setCart((prev) => prev.filter((item) => item.uid !== uid))
  }

  function handleUpdateCartQtd(uid: string, value: string) {
    const qtd = Number(value.replace(",", "."))
    setCart((prev) =>
      prev.map((item) =>
        item.uid === uid
          ? { ...item, qtd: Number.isFinite(qtd) && qtd > 0 ? qtd : item.qtd }
          : item
      )
    )
  }

  function handleAdjustCartQtd(uid: string, direction: -1 | 1) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item

        const nextQtd = clampCartQuantity(
          item.qtd + getCartQuantityStep(item) * direction,
          item.unidade
        )

        return { ...item, qtd: nextQtd }
      })
    )
  }

  function handleSave() {
    if (mealId == null) return

    if (cart.length === 0) {
      setError("Adicione pelo menos um alimento ao carrinho.")
      return
    }

    const componentes = cartToComponentes(cart)
    const descricao = componentes.map((item) => item.nome).join(" + ")

    startSaveTransition(async () => {
      const result = await updateMeal({
        id: mealId,
        categoria: category,
        descricao,
        calorias: Math.round(totals.calorias),
        proteinas: Math.round(totals.proteinas * 10) / 10,
        carboidratos: Math.round(totals.carboidratos * 10) / 10,
        gorduras: Math.round(totals.gorduras * 10) / 10,
        componentes,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      showFeedback("Refeição atualizada.")
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed inset-x-3 top-[4dvh] flex max-h-[92dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden border-brand-cyan/25 bg-zinc-950 p-0 shadow-2xl shadow-brand-cyan/10 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b border-brand-cyan/20 bg-gradient-to-br from-cyan-950/45 via-zinc-950 to-purple-950/25 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-white">Editar refeição</DialogTitle>
              <DialogDescription className="text-slate-300">
            Ajuste os alimentos, quantidades e categoria.
              </DialogDescription>
            </div>
            {cart.length > 0 ? (
              <div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 text-brand-cyan shadow-sm shadow-brand-cyan/10">
                <span className="text-[10px] font-medium uppercase leading-none">
                  Itens
                </span>
                <span className="text-xs font-semibold tabular-nums text-white">
                  {cart.length}
                </span>
              </div>
            ) : null}
          </div>

          <div className="pt-2">
            <Label htmlFor="edit-meal-category" className="sr-only">
              Categoria
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                id="edit-meal-category"
                className="w-full border-brand-cyan/25 bg-black/35 text-white shadow-inner shadow-brand-cyan/10"
              >
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <p className="mb-1 text-[10px] font-medium uppercase text-slate-400">
              Total ajustado
            </p>
            <div className="grid grid-cols-2 gap-2">
              {EDIT_MACRO_SUMMARY_ITEMS.map((item, index) => {
                const value = totals[item.key]
                return (
                  <div
                    key={item.key}
                    className={cn(
                      "min-w-0 rounded-lg border px-3 py-2 shadow-sm",
                      EDIT_MACRO_SUMMARY_ACCENTS[index]
                    )}
                  >
                    <span className="block text-[10px] font-medium uppercase text-slate-400">
                      {item.label}
                    </span>
                    <span className="block truncate text-base font-semibold tabular-nums text-white">
                      {formatMacroValue(value, item.unit)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-950 to-cyan-950/20 px-4 py-4">
          {isLoadingMeal ? (
            <p className="flex items-center gap-2 rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-3 text-sm text-brand-cyan">
              <Loader2 className="size-4 animate-spin" />
              Carregando refeição...
            </p>
          ) : (
            <>
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="edit-food-search">Buscar alimento</Label>
                  <span className="text-xs text-muted-foreground">
                    Adicionar item
                  </span>
                </div>
                <Input
                  id="edit-food-search"
                  placeholder="Digite pelo menos 2 letras..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                  className="border-white/10 bg-black/35 focus-visible:ring-brand-cyan/50"
                />

                {isSearching && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Buscando...
                  </p>
                )}

                {!isSearching && results.length > 0 && (
                  <ul className="max-h-40 overflow-y-auto rounded-lg border border-brand-blue/25 bg-brand-blue/5">
                    {results.map((food) => (
                      <li key={food.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-brand-blue/10"
                          onClick={() => handleSelectFood(food)}
                        >
                          <span className="min-w-0 truncate">{food.descricao}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {Math.round(food.calorias)} kcal / {food.qtdReferencia}
                            {food.unidadeReferencia}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {pendingFood && (
                  <div className="rounded-lg border border-brand-cyan/35 bg-brand-cyan/10 p-3 shadow-sm shadow-brand-cyan/10">
                    <p className="text-sm font-medium">{pendingFood.descricao}</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <Label htmlFor="edit-pending-qtd">Quantidade</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="edit-pending-qtd"
                            type="number"
                            min="0"
                            step="any"
                            value={pendingQtd}
                            onChange={(event) =>
                              setPendingQtd(event.target.value)
                            }
                          />
                          <span className="text-sm text-muted-foreground">
                            {pendingFood.unidadeReferencia}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleConfirmAdd}
                        >
                          <Plus className="size-4" />
                          Adicionar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setPendingFood(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                <div>
                  <h3 className="text-sm font-medium">Itens da refeição</h3>
                  <p className="text-xs text-muted-foreground">
                    {cart.length > 0
                      ? `${cart.length} ${cart.length === 1 ? "item" : "itens"} nesta refeição`
                      : "Adicione alimentos para atualizar a refeição"}
                  </p>
                </div>

                {cart.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-brand-blue/30 bg-brand-blue/5 px-3 py-5 text-center">
                    <p className="text-sm font-medium text-white">
                      Nenhum item na refeição
                    </p>
                    <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                      Busque um alimento acima para reconstruir esta refeição.
                    </p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {cart.map((item) => (
                      <li
                        key={item.uid}
                        className="rounded-lg border border-white/10 bg-black/25 px-3 py-2.5"
                      >
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.nome}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatCartMacroSummary(item)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveFromCart(item.uid)}
                            aria-label={`Remover ${item.nome}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleAdjustCartQtd(item.uid, -1)}
                              aria-label={`Diminuir quantidade de ${item.nome}`}
                            >
                              <Minus className="size-3.5" />
                            </Button>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                className="h-8 w-20 text-center"
                                value={item.qtd}
                                onChange={(event) =>
                                  handleUpdateCartQtd(
                                    item.uid,
                                    event.target.value
                                  )
                                }
                              />
                              <span className="w-8 text-xs text-muted-foreground">
                                {item.unidade}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleAdjustCartQtd(item.uid, 1)}
                              aria-label={`Aumentar quantidade de ${item.nome}`}
                            >
                              <Plus className="size-3.5" />
                            </Button>
                          </div>

                          <span className="text-xs text-muted-foreground">
                            +/- {getCartQuantityStep(item)}
                            {item.unidade}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t border-brand-cyan/20 bg-black/35 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pb-5">
          <p className="w-full rounded-lg border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-2 text-xs text-slate-300 sm:mr-auto sm:w-auto">
            <span className="font-medium text-foreground">
              {Math.round(totals.calorias)} kcal
            </span>{" "}
            · P {Math.round(totals.proteinas)}g · C{" "}
            {Math.round(totals.carboidratos)}g · G{" "}
            {Math.round(totals.gorduras)}g
          </p>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoadingMeal || cart.length === 0}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando…
              </>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
