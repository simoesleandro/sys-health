"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2 } from "lucide-react"

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
import { searchFoods } from "@/lib/actions/foods"
import { createMeal } from "@/lib/actions/meals"
import {
  type CartItem,
  type FoodSearchResult,
  MEAL_CATEGORIES,
  cartToComponentes,
  foodToCartItem,
  suggestMealCategoryByHour,
  sumCartMacros,
} from "@/lib/meals"
import { useMealModal } from "@/components/modals/quick-modals-context"

function resetModalState(
  setters: {
    setQuery: (v: string) => void
    setResults: (v: FoodSearchResult[]) => void
    setCart: (v: CartItem[]) => void
    setPendingFood: (v: FoodSearchResult | null) => void
    setPendingQtd: (v: string) => void
    setCategory: (v: string) => void
    setError: (v: string | null) => void
  }
) {
  setters.setQuery("")
  setters.setResults([])
  setters.setCart([])
  setters.setPendingFood(null)
  setters.setPendingQtd("")
  setters.setCategory(suggestMealCategoryByHour())
  setters.setError(null)
}

export function MealModal() {
  const router = useRouter()
  const { open, setOpen } = useMealModal()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<FoodSearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [pendingFood, setPendingFood] = React.useState<FoodSearchResult | null>(
    null
  )
  const [pendingQtd, setPendingQtd] = React.useState("")
  const [category, setCategory] = React.useState<string>(
    suggestMealCategoryByHour()
  )
  const [error, setError] = React.useState<string | null>(null)
  const [isSaving, startSaveTransition] = React.useTransition()

  const totals = React.useMemo(() => sumCartMacros(cart), [cart])

  React.useEffect(() => {
    if (!open) return

    const term = query.trim()
    if (term.length < 2) {
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

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetModalState({
        setQuery,
        setResults,
        setCart,
        setPendingFood,
        setPendingQtd,
        setCategory,
        setError,
      })
    } else {
      setCategory(suggestMealCategoryByHour())
    }
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

  function handleSave() {
    if (cart.length === 0) {
      setError("Adicione pelo menos um alimento ao carrinho.")
      return
    }

    const componentes = cartToComponentes(cart)
    const descricao = componentes.map((item) => item.nome).join(" + ")

    startSaveTransition(async () => {
      const result = await createMeal({
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

      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="fixed inset-x-3 top-[4dvh] flex max-h-[92dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[85vh] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b px-4 py-4">
          <DialogTitle>Nova refeição</DialogTitle>
          <DialogDescription>
            Busque alimentos, monte o carrinho e salve a refeição.
          </DialogDescription>

          <div className="pt-2">
            <Label htmlFor="meal-category" className="sr-only">
              Categoria
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="meal-category" className="w-full">
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
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          <section className="flex flex-col gap-2">
            <Label htmlFor="food-search">Buscar alimento</Label>
            <Input
              id="food-search"
              placeholder="Digite pelo menos 2 letras..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />

            {isSearching && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Buscando...
              </p>
            )}

            {!isSearching && results.length > 0 && (
              <ul className="max-h-40 overflow-y-auto rounded-lg border border-border">
                {results.map((food) => (
                  <li key={food.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60"
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
              <div className="rounded-lg border border-cyan/30 bg-cyan/5 p-3">
                <p className="text-sm font-medium">{pendingFood.descricao}</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="pending-qtd">Quantidade</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="pending-qtd"
                        type="number"
                        min="0"
                        step="any"
                        value={pendingQtd}
                        onChange={(event) => setPendingQtd(event.target.value)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {pendingFood.unidadeReferencia}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleConfirmAdd}>
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

          <section className="flex min-h-0 flex-1 flex-col gap-2">
            <h3 className="text-sm font-medium">Carrinho</h3>

            {cart.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhum item no carrinho.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {cart.map((item) => (
                  <li
                    key={item.uid}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.nome}</p>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      className="h-8 w-20"
                      value={item.qtd}
                      onChange={(event) =>
                        handleUpdateCartQtd(item.uid, event.target.value)
                      }
                    />
                    <span className="w-6 text-xs text-muted-foreground">
                      {item.unidade}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveFromCart(item.uid)}
                      aria-label={`Remover ${item.nome}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground sm:mr-auto">
            {Math.round(totals.calorias)} kcal · P {Math.round(totals.proteinas)}g
            · C {Math.round(totals.carboidratos)}g · G {Math.round(totals.gorduras)}
            g
          </p>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || cart.length === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar refeição"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
