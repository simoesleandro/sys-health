"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Minus, Plus, Save, Sparkles, Trash2 } from "lucide-react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MealModalAiPanel,
  type MealAiAnalysisMeta,
} from "@/components/modals/meal-modal-ai-panel"
import { useMealModal, useQuickModals } from "@/components/modals/quick-modals-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createFood, getFoodShortcuts, searchFoods } from "@/lib/actions/foods"
import { logMealAnalysis } from "@/lib/actions/meal-analysis"
import {
  createMeal,
  getRecentFoodPortions,
  getRecentMealTemplates,
  getTodayMealMacroSnapshot,
  type MealMacroSnapshot,
  type RecentFoodPortion,
  type RecentMealTemplate,
} from "@/lib/actions/meals"
import type { MealAnalysisItem } from "@/lib/meal-analysis"
import {
  FOOD_REFERENCE_UNITS,
  formatFoodPortion,
  type FoodFormInput,
  type FoodReferenceUnit,
} from "@/lib/foods"
import {
  type CartItem,
  type FoodSearchResult,
  MEAL_CATEGORIES,
  aiItemToCartItem,
  calcItemMacros,
  cartToComponentes,
  foodToCartItem,
  suggestMealCategoryByHour,
  sumCartMacros,
  supplementToCartItem,
} from "@/lib/meals"
import type { SupplementPreset } from "@/lib/supplements"
import { cn } from "@/lib/utils"

const EMPTY_INLINE_FORM: FoodFormInput = {
  descricao: "",
  categoria: "Lanche",
  calorias: 0,
  proteinas: 0,
  carboidratos: 0,
  gorduras: 0,
  qtdReferencia: 100,
  unidadeReferencia: "g",
}

function resetModalState(
  setters: {
    setQuery: (v: string) => void
    setResults: (v: FoodSearchResult[]) => void
    setCart: (v: CartItem[]) => void
    setPendingFood: (v: FoodSearchResult | null) => void
    setPendingQtd: (v: string) => void
    setPendingQtdHint: (v: string | null) => void
    setCategory: (v: string) => void
    setError: (v: string | null) => void
    setShowInlineCreate: (v: boolean) => void
    setInlineForm: (v: FoodFormInput) => void
    setActiveTab: (v: "manual" | "text" | "photo") => void
    setPendingAnalysis: (v: PendingMealAnalysis | null) => void
    setInlineHint: (v: string | null) => void
    setSaveAiItemsToBank: (v: boolean) => void
    setMacroSnapshot: (v: MealMacroSnapshot | null) => void
    setRecentFoodPortions: (v: Record<number, RecentFoodPortion>) => void
    setRecentMeals: (v: RecentMealTemplate[]) => void
    setComboHint: (v: string | null) => void
    setComboDialogOpen: (v: boolean) => void
    setComboName: (v: string) => void
    setComboError: (v: string | null) => void
    setShortcutTab: (v: ShortcutTab) => void
  }
) {
  setters.setQuery("")
  setters.setResults([])
  setters.setCart([])
  setters.setPendingFood(null)
  setters.setPendingQtd("")
  setters.setPendingQtdHint(null)
  setters.setCategory(suggestMealCategoryByHour())
  setters.setError(null)
  setters.setShowInlineCreate(false)
  setters.setInlineForm(EMPTY_INLINE_FORM)
  setters.setActiveTab("manual")
  setters.setPendingAnalysis(null)
  setters.setInlineHint(null)
  setters.setSaveAiItemsToBank(true)
  setters.setMacroSnapshot(null)
  setters.setRecentFoodPortions({})
  setters.setRecentMeals([])
  setters.setComboHint(null)
  setters.setComboDialogOpen(false)
  setters.setComboName("")
  setters.setComboError(null)
  setters.setShortcutTab("recent")
}

type PendingMealAnalysis = MealAiAnalysisMeta & {
  itens: MealAnalysisItem[]
}

type ShortcutTab = "smart" | "recent" | "favorite" | "combo"

type MealModalMacroRemaining = {
  calorias: number
  proteinas: number
  carboidratos: number
  gorduras: number
} | null

const MACRO_SUMMARY_ITEMS = [
  { key: "calorias", label: "Kcal", unit: "" },
  { key: "proteinas", label: "Prot", unit: "g" },
  { key: "carboidratos", label: "Carb", unit: "g" },
  { key: "gorduras", label: "Gord", unit: "g" },
] as const

function isSupplementCartItem(item: CartItem) {
  return item.uid.startsWith("supp-")
}

function isUnsavedAiCartItem(item: CartItem) {
  return item.uid.startsWith("ia-") && item.bancoId <= 0
}

function normalizeFoodUnit(value: string): FoodReferenceUnit {
  const unit = value.trim().toLowerCase()
  if (FOOD_REFERENCE_UNITS.includes(unit as FoodReferenceUnit)) {
    return unit as FoodReferenceUnit
  }
  if (unit === "un" || unit === "unidade" || unit === "unidades") return "und"
  return "g"
}

function formatQuantityInput(value: number) {
  return String(value)
}

function formatRemainingMacro(value: number, unit: string) {
  const rounded = Math.round(value * 10) / 10
  const absValue = Math.abs(rounded)
  const formatted = Number.isInteger(absValue)
    ? String(absValue)
    : absValue.toFixed(1)

  return `${rounded < 0 ? "+" : ""}${formatted}${unit}`
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10
}

function roundSuggestedQuantity(value: number, unit: string) {
  if (unit === "und") return Math.max(1, Math.round(value))
  if (value >= 20) return Math.max(1, Math.round(value / 5) * 5)
  return Math.max(1, Math.round(value * 10) / 10)
}

function clampSuggestedQuantity(food: FoodSearchResult, value: number) {
  const unit = normalizeFoodUnit(food.unidadeReferencia)
  if (unit === "und") {
    return Math.min(
      roundSuggestedQuantity(value, unit),
      isComboFood(food) ? 2 : 4
    )
  }

  const min = Math.max(1, food.qtdReferencia * 0.5)
  const max = Math.max(min, food.qtdReferencia * 3)
  const rounded = roundSuggestedQuantity(value, unit)

  return Math.min(Math.max(rounded, min), max)
}

function normalizeFoodCategory(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
}

function isComboFood(food: FoodSearchResult) {
  return normalizeFoodCategory(food.categoria) === "combo"
}

function isMealTemplateForCategory(
  meal: RecentMealTemplate,
  categoria: string
) {
  return normalizeFoodCategory(meal.categoria) === normalizeFoodCategory(categoria)
}

function getFoodShortcutScore(food: FoodSearchResult, categoria: string) {
  const usageScore = Math.min(food.vezesUsado, 30) * 3
  const categoryScore =
    normalizeFoodCategory(food.categoria) === normalizeFoodCategory(categoria)
      ? 24
      : 0
  const comboScore = isComboFood(food) ? 8 : 0

  return usageScore + categoryScore + comboScore
}

function sortFoodShortcuts(
  foods: FoodSearchResult[],
  categoria: string,
  options: { keepCombosLast?: boolean } = {}
) {
  return foods
    .slice()
    .sort((a, b) => {
      if (options.keepCombosLast && isComboFood(a) !== isComboFood(b)) {
        return isComboFood(a) ? 1 : -1
      }

      const scoreDiff =
        getFoodShortcutScore(b, categoria) -
        getFoodShortcutScore(a, categoria)
      if (scoreDiff !== 0) return scoreDiff

      return a.descricao.localeCompare(b.descricao, "pt-BR")
    })
}

function getMacroFitScore(
  food: FoodSearchResult,
  remaining: NonNullable<MealModalMacroRemaining>
) {
  const remainingCalories = Math.max(remaining.calorias, 0)
  const remainingProtein = Math.max(remaining.proteinas, 0)
  const remainingCarbs = Math.max(remaining.carboidratos, 0)
  const remainingFats = Math.max(remaining.gorduras, 0)

  if (
    remainingCalories <= 0 &&
    remainingProtein <= 0 &&
    remainingCarbs <= 0 &&
    remainingFats <= 0
  ) {
    return 0
  }

  let score = Math.min(food.vezesUsado, 12) * 1.5

  score += Math.min(food.proteinas, remainingProtein) * 5
  score += Math.min(food.carboidratos, remainingCarbs) * 2.4
  score += Math.min(food.gorduras, remainingFats) * 1.8

  if (remainingCalories > 0) {
    const targetCalories = Math.min(remainingCalories, 550)
    const calorieDistance = Math.abs(food.calorias - targetCalories)
    score += Math.max(0, 45 - calorieDistance / 8)

    if (food.calorias > remainingCalories + 250) {
      score -= 35
    }
  }

  if (food.proteinas >= 20 && remainingProtein >= 15) score += 18
  if (food.carboidratos >= 25 && remainingCarbs >= 25) score += 10

  return score
}

function getMacroFitLabel(
  food: FoodSearchResult,
  remaining: NonNullable<MealModalMacroRemaining>
) {
  const options = [
    {
      label: "proteína",
      value: Math.min(food.proteinas, Math.max(remaining.proteinas, 0)),
      amount: food.proteinas,
      unit: "g",
    },
    {
      label: "carbo",
      value: Math.min(food.carboidratos, Math.max(remaining.carboidratos, 0)),
      amount: food.carboidratos,
      unit: "g",
    },
    {
      label: "gordura",
      value: Math.min(food.gorduras, Math.max(remaining.gorduras, 0)),
      amount: food.gorduras,
      unit: "g",
    },
  ].sort((a, b) => b.value - a.value)

  const best = options[0]
  if (best && best.value > 0) {
    return `${roundMacro(best.amount)}${best.unit} ${best.label}`
  }

  return `${Math.round(food.calorias)} kcal`
}

function getSuggestedFoodQuantity(
  food: FoodSearchResult,
  remaining: NonNullable<MealModalMacroRemaining>
) {
  const candidates = [
    {
      remaining: Math.max(remaining.proteinas, 0),
      perReference: food.proteinas,
      priority: 5,
    },
    {
      remaining: Math.max(remaining.carboidratos, 0),
      perReference: food.carboidratos,
      priority: 2.4,
    },
    {
      remaining: Math.max(remaining.gorduras, 0),
      perReference: food.gorduras,
      priority: 1.8,
    },
    {
      remaining: Math.max(remaining.calorias, 0),
      perReference: food.calorias,
      priority: 0.15,
    },
  ]
    .filter((item) => item.remaining > 0 && item.perReference > 0)
    .sort(
      (a, b) =>
        Math.min(b.remaining, b.perReference) * b.priority -
        Math.min(a.remaining, a.perReference) * a.priority
    )

  const target = candidates[0]
  if (!target) return food.qtdReferencia

  return clampSuggestedQuantity(
    food,
    (target.remaining / target.perReference) * food.qtdReferencia
  )
}

function indexRecentFoodPortions(portions: RecentFoodPortion[]) {
  return portions.reduce<Record<number, RecentFoodPortion>>((acc, portion) => {
    acc[portion.foodId] = portion
    return acc
  }, {})
}

function cartItemToFoodInput(item: CartItem, categoria: string): FoodFormInput {
  const macros = calcItemMacros(item)

  return {
    descricao: item.nome,
    categoria,
    calorias: macros.kcal,
    proteinas: macros.prot,
    carboidratos: macros.carb,
    gorduras: macros.gord,
    qtdReferencia: item.qtd,
    unidadeReferencia: normalizeFoodUnit(item.unidade),
  }
}

function cloneCartItem(item: CartItem): CartItem {
  return {
    ...item,
    uid: `recent-${item.bancoId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }
}

function formatMealTemplateItems(meal: RecentMealTemplate) {
  const names = meal.cart
    .slice(0, 3)
    .map((item) => item.nome.trim())
    .filter(Boolean)

  if (names.length === 0) return meal.descricao

  const remaining = meal.cart.length - names.length
  return remaining > 0 ? `${names.join(", ")} +${remaining}` : names.join(", ")
}

function formatMealTemplateCount(meal: RecentMealTemplate) {
  return `${meal.cart.length} ${meal.cart.length === 1 ? "item" : "itens"}`
}

function formatCartMacroSummary(item: CartItem) {
  const macros = calcItemMacros(item)

  return `${Math.round(macros.kcal)} kcal · P ${roundMacro(macros.prot)}g · C ${roundMacro(macros.carb)}g · G ${roundMacro(macros.gord)}g`
}

function getCartQuantityStep(item: CartItem) {
  const unit = normalizeFoodUnit(item.unidade)
  if (unit === "und") return 1
  if (item.qtdRef >= 100) return 25
  if (item.qtdRef >= 30) return 10
  return 5
}

function clampCartQuantity(value: number, unit: string) {
  if (!Number.isFinite(value)) return 1
  const min = normalizeFoodUnit(unit) === "und" ? 1 : 0.5
  return Math.max(min, roundSuggestedQuantity(value, normalizeFoodUnit(unit)))
}

export function MealModal() {
  const router = useRouter()
  const { open, setOpen } = useMealModal()
  const { supplementPresets } = useQuickModals()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<FoodSearchResult[]>([])
  const [quickFoods, setQuickFoods] = React.useState<FoodSearchResult[]>([])
  const [recentFoodPortions, setRecentFoodPortions] = React.useState<
    Record<number, RecentFoodPortion>
  >({})
  const [recentMeals, setRecentMeals] = React.useState<RecentMealTemplate[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [pendingFood, setPendingFood] = React.useState<FoodSearchResult | null>(
    null
  )
  const [pendingQtd, setPendingQtd] = React.useState("")
  const [pendingQtdHint, setPendingQtdHint] = React.useState<string | null>(null)
  const [category, setCategory] = React.useState<string>(
    suggestMealCategoryByHour()
  )
  const [error, setError] = React.useState<string | null>(null)
  const [showInlineCreate, setShowInlineCreate] = React.useState(false)
  const [inlineForm, setInlineForm] =
    React.useState<FoodFormInput>(EMPTY_INLINE_FORM)
  const [inlineHint, setInlineHint] = React.useState<string | null>(null)
  const [comboHint, setComboHint] = React.useState<string | null>(null)
  const [comboError, setComboError] = React.useState<string | null>(null)
  const [comboDialogOpen, setComboDialogOpen] = React.useState(false)
  const [comboName, setComboName] = React.useState("")
  const [shortcutTab, setShortcutTab] =
    React.useState<ShortcutTab>("recent")
  const [saveAiItemsToBank, setSaveAiItemsToBank] = React.useState(true)
  const [isCreatingFood, startCreateFoodTransition] = React.useTransition()
  const [isSavingCombo, startSaveComboTransition] = React.useTransition()
  const [isAnalyzingInlineFood, startAnalyzeInlineFoodTransition] =
    React.useTransition()
  const [isSaving, startSaveTransition] = React.useTransition()
  const [activeTab, setActiveTab] = React.useState<"manual" | "text" | "photo">(
    "manual"
  )
  const [pendingAnalysis, setPendingAnalysis] =
    React.useState<PendingMealAnalysis | null>(null)
  const [macroSnapshot, setMacroSnapshot] =
    React.useState<MealMacroSnapshot | null>(null)

  const trimmedQuery = query.trim()
  const showEmptySearchHint =
    !isSearching &&
    trimmedQuery.length >= 2 &&
    results.length === 0 &&
    !pendingFood

  const totals = React.useMemo(() => sumCartMacros(cart), [cart])
  const macroRemaining = React.useMemo(() => {
    if (!macroSnapshot) return null

    return {
      calorias:
        macroSnapshot.goals.calorias -
        macroSnapshot.consumed.calorias -
        totals.calorias,
      proteinas:
        macroSnapshot.goals.proteinas -
        macroSnapshot.consumed.proteinas -
        totals.proteinas,
      carboidratos:
        macroSnapshot.goals.carboidratos -
        macroSnapshot.consumed.carboidratos -
        totals.carboidratos,
      gorduras:
        macroSnapshot.goals.gorduras -
        macroSnapshot.consumed.gorduras -
        totals.gorduras,
    }
  }, [macroSnapshot, totals])
  const hasUnsavedAiItems = React.useMemo(
    () => cart.some(isUnsavedAiCartItem),
    [cart]
  )
  const comboFoods = React.useMemo(
    () =>
      sortFoodShortcuts(
        quickFoods.filter(isComboFood),
        category
      ),
    [quickFoods, category]
  )
  const favoriteFoods = React.useMemo(
    () =>
      sortFoodShortcuts(
        quickFoods.filter((food) => !isComboFood(food)),
        category
      ),
    [quickFoods, category]
  )
  const sortedResults = React.useMemo(
    () => sortFoodShortcuts(results, category, { keepCombosLast: true }),
    [results, category]
  )
  const macroSuggestedFoods = React.useMemo(() => {
    if (!macroRemaining) return []

    const cartFoodIds = new Set(
      cart
        .map((item) => item.bancoId)
        .filter((foodId) => Number.isFinite(foodId) && foodId > 0)
    )

    return quickFoods
      .filter((food) => !cartFoodIds.has(food.id))
      .map((food) => ({
        food,
        label: getMacroFitLabel(food, macroRemaining),
        suggestedQtd: getSuggestedFoodQuantity(food, macroRemaining),
        score: getMacroFitScore(food, macroRemaining),
      }))
      .filter((item) => item.score > 12)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.food.descricao.localeCompare(b.food.descricao, "pt-BR")
      })
      .slice(0, 4)
  }, [cart, macroRemaining, quickFoods])
  const smartMeals = React.useMemo(
    () =>
      recentMeals
        .filter((meal) => isMealTemplateForCategory(meal, category))
        .slice(0, 4),
    [recentMeals, category]
  )
  const hasShortcuts =
    smartMeals.length > 0 ||
    recentMeals.length > 0 ||
    favoriteFoods.length > 0 ||
    comboFoods.length > 0
  const fallbackShortcutTab: ShortcutTab =
    smartMeals.length > 0
      ? "smart"
      : recentMeals.length > 0
      ? "recent"
      : favoriteFoods.length > 0
        ? "favorite"
        : "combo"
  const activeShortcutTab =
    (shortcutTab === "smart" && smartMeals.length > 0) ||
    (shortcutTab === "recent" && recentMeals.length > 0) ||
    (shortcutTab === "favorite" && favoriteFoods.length > 0) ||
    (shortcutTab === "combo" && comboFoods.length > 0)
      ? shortcutTab
      : fallbackShortcutTab
  const pendingRecentPortion = React.useMemo(() => {
    if (!pendingFood) return null

    const recentPortion = recentFoodPortions[pendingFood.id]
    if (!recentPortion) return null

    return normalizeFoodUnit(recentPortion.unidade) ===
      normalizeFoodUnit(pendingFood.unidadeReferencia)
      ? recentPortion
      : null
  }, [pendingFood, recentFoodPortions])

  React.useEffect(() => {
    if (!open) return

    void getTodayMealMacroSnapshot().then(setMacroSnapshot)
    void getFoodShortcuts(8, 8).then(setQuickFoods)
    void getRecentFoodPortions(80).then((portions) =>
      setRecentFoodPortions(indexRecentFoodPortions(portions))
    )
    void getRecentMealTemplates(10).then(setRecentMeals)
  }, [open])

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

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetModalState({
        setQuery,
        setResults,
        setCart,
        setPendingFood,
        setPendingQtd,
        setPendingQtdHint,
        setCategory,
        setError,
        setShowInlineCreate,
        setInlineForm,
        setActiveTab,
        setPendingAnalysis,
        setInlineHint,
        setSaveAiItemsToBank,
        setMacroSnapshot,
        setRecentFoodPortions,
        setRecentMeals,
        setComboHint,
        setComboDialogOpen,
        setComboName,
        setComboError,
        setShortcutTab,
      })
    } else {
      setCategory(suggestMealCategoryByHour())
    }
  }

  function handleSelectFood(
    food: FoodSearchResult,
    options: { qtd?: number; hint?: string } = {}
  ) {
    const recentPortion = recentFoodPortions[food.id]
    const shouldUseRecentPortion =
      options.qtd == null &&
      recentPortion &&
      normalizeFoodUnit(recentPortion.unidade) ===
        normalizeFoodUnit(food.unidadeReferencia)

    setPendingFood(food)
    setPendingQtd(
      formatQuantityInput(
        options.qtd ??
          (shouldUseRecentPortion ? recentPortion.qtd : food.qtdReferencia)
      )
    )
    setPendingQtdHint(options.hint ?? null)
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
    setPendingQtdHint(null)
    setQuery("")
    setResults([])
    setError(null)
    setComboHint(null)
  }

  function handleAddRecentMeal(meal: RecentMealTemplate) {
    setCart((prev) => [...prev, ...meal.cart.map(cloneCartItem)])
    setCategory(meal.categoria)
    setError(null)
    setComboHint(`${meal.categoria} repetida no carrinho.`)
  }

  function renderMealTemplateButton(
    meal: RecentMealTemplate,
    options: { compact?: boolean } = {}
  ) {
    return (
      <button
        key={meal.id}
        type="button"
        onClick={() => handleAddRecentMeal(meal)}
        className={cn(
          "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
          options.compact
            ? "border-border hover:bg-muted/50"
            : "border-cyan/30 bg-cyan/5 hover:bg-cyan/10"
        )}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-medium">
            {meal.categoria}
          </span>
          <span className="shrink-0 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            Repetir
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {formatMealTemplateItems(meal)}
        </span>
        <span className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{meal.hora}</span>
          <span>
            {formatMealTemplateCount(meal)} · {Math.round(meal.calorias)} kcal ·
            P {Math.round(meal.proteinas)}g
          </span>
        </span>
      </button>
    )
  }

  function handleRemoveFromCart(uid: string) {
    setCart((prev) => prev.filter((item) => item.uid !== uid))
  }

  function toggleSupplement(preset: SupplementPreset) {
    const uid = `supp-${preset.id}`
    setCart((prev) => {
      if (prev.some((item) => item.uid === uid)) {
        return prev.filter((item) => item.uid !== uid)
      }
      return [...prev, supplementToCartItem(preset)]
    })
    setError(null)
    setComboHint(null)
  }

  function openInlineCreate() {
    setShowInlineCreate(true)
    setInlineForm({
      ...EMPTY_INLINE_FORM,
      descricao: trimmedQuery,
    })
    setError(null)
    setInlineHint(null)
    setComboHint(null)
  }

  function updateInlineField<K extends keyof FoodFormInput>(
    key: K,
    value: FoodFormInput[K]
  ) {
    setInlineForm((current) => ({ ...current, [key]: value }))
    setError(null)
    setInlineHint(null)
  }

  function handleAddAiItems(payload: {
    items: MealAnalysisItem[]
    meta: MealAiAnalysisMeta
  }) {
    setCart((prev) => [...prev, ...payload.items.map(aiItemToCartItem)])
    setPendingAnalysis({
      ...payload.meta,
      itens: payload.items,
    })
    setActiveTab("manual")
    setError(null)
    setComboHint(null)
  }

  function getDefaultComboName() {
    return cart
      .slice(0, 3)
      .map((item) => item.nome)
      .join(" + ")
  }

  function openComboDialog() {
    if (cart.length === 0) return

    setComboName(getDefaultComboName())
    setComboError(null)
    setComboDialogOpen(true)
  }

  function handleSaveCombo() {
    const descricao = comboName.trim()
    if (!descricao) {
      setComboError("Informe um nome para o combo.")
      return
    }

    setError(null)
    setComboHint(null)
    setComboError(null)
    startSaveComboTransition(async () => {
      const result = await createFood({
        descricao,
        categoria: "Combo",
        calorias: Math.round(totals.calorias),
        proteinas: Math.round(totals.proteinas * 10) / 10,
        carboidratos: Math.round(totals.carboidratos * 10) / 10,
        gorduras: Math.round(totals.gorduras * 10) / 10,
        qtdReferencia: 1,
        unidadeReferencia: "und",
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      setQuickFoods((prev) =>
        [result.food, ...prev.filter((food) => food.id !== result.food.id)].slice(0, 16)
      )
      setComboHint("Combo salvo no banco de alimentos.")
      setComboDialogOpen(false)
      setComboName("")
      setShortcutTab("combo")
      router.refresh()
    })
  }

  function handleCreateInlineFood() {
    startCreateFoodTransition(async () => {
      const result = await createFood(inlineForm)
      if (!result.success) {
        setError(result.error)
        return
      }

      const qtd = inlineForm.qtdReferencia
      setCart((prev) => [...prev, foodToCartItem(result.food, qtd)])
      setShowInlineCreate(false)
      setInlineForm(EMPTY_INLINE_FORM)
      setQuery("")
      setResults([])
      setError(null)
    })
  }

  function handleAnalyzeInlineFood() {
    const descricao = inlineForm.descricao.trim()
    if (descricao.length < 2) {
      setError("Informe o nome do alimento antes de estimar.")
      return
    }

    setError(null)
    setInlineHint(null)
    startAnalyzeInlineFoodTransition(async () => {
      try {
        const response = await fetch("/api/foods/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            descricao,
            qtdReferencia: inlineForm.qtdReferencia,
            unidadeReferencia: inlineForm.unidadeReferencia,
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

        setInlineForm(data.food)
        setInlineHint("Estimativa aplicada. Revise antes de criar.")
      } catch {
        setError("Falha de rede ao contactar a IA.")
      }
    })
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
        if (item.uid !== uid || isSupplementCartItem(item)) return item

        const nextQtd = clampCartQuantity(
          item.qtd + getCartQuantityStep(item) * direction,
          item.unidade
        )

        return { ...item, qtd: nextQtd }
      })
    )
  }

  function handleSave() {
    if (cart.length === 0) {
      setError("Adicione pelo menos um alimento ao carrinho.")
      return
    }

    startSaveTransition(async () => {
      let cartForSave = cart

      if (saveAiItemsToBank && hasUnsavedAiItems) {
        const materialized: CartItem[] = []

        for (const item of cartForSave) {
          if (!isUnsavedAiCartItem(item)) {
            materialized.push(item)
            continue
          }

          const result = await createFood(cartItemToFoodInput(item, category))
          if (!result.success) {
            setError(result.error)
            return
          }

          materialized.push(foodToCartItem(result.food, item.qtd))
        }

        cartForSave = materialized
        setCart(materialized)
      }

      const componentes = cartToComponentes(cartForSave)
      const descricao = componentes.map((item) => item.nome).join(" + ")

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

      if (pendingAnalysis) {
        await logMealAnalysis({
          tipo: pendingAnalysis.tipo,
          entradaTexto: pendingAnalysis.entradaTexto,
          imagemNome: pendingAnalysis.imagemNome,
          respostaBruta: pendingAnalysis.raw,
          itens: pendingAnalysis.itens,
          refeicaoId: result.id,
        })
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
        <DialogHeader className="shrink-0 border-b px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>Nova refeição</DialogTitle>
              <DialogDescription>
                Monte o carrinho, ajuste macros e salve.
              </DialogDescription>
            </div>
            {cart.length > 0 ? (
              <div className="shrink-0 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1.5 text-right">
                <span className="block text-[10px] font-medium uppercase text-muted-foreground">
                  Carrinho
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {cart.length}
                </span>
              </div>
            ) : null}
          </div>

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

          {macroRemaining ? (
            <div className="pt-2">
              <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
                Restante hoje
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MACRO_SUMMARY_ITEMS.map((item) => {
                  const value = macroRemaining[item.key]
                  return (
                    <div
                      key={item.key}
                      className="rounded-lg border border-border/70 bg-muted/20 px-2 py-1.5"
                    >
                      <span className="block text-[10px] font-medium uppercase text-muted-foreground">
                        {item.label}
                      </span>
                      <span
                        className={cn(
                          "block text-sm font-semibold tabular-nums",
                          value < 0 ? "text-amber-300" : "text-foreground"
                        )}
                      >
                        {formatRemainingMacro(value, item.unit)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "manual" | "text" | "photo")
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="manual" className="flex-1">
                Manual
              </TabsTrigger>
              <TabsTrigger value="text" className="flex-1">
                Texto IA
              </TabsTrigger>
              <TabsTrigger value="photo" className="flex-1">
                Foto IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="mt-4">
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="food-search">Buscar alimento</Label>
              {!trimmedQuery && !pendingFood ? (
                <span className="text-xs text-muted-foreground">
                  Atalhos abaixo
                </span>
              ) : null}
            </div>
            <Input
              id="food-search"
              placeholder="Digite pelo menos 2 letras..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />

            {!trimmedQuery &&
              !pendingFood &&
              macroSuggestedFoods.length > 0 && (
                <div className="rounded-lg border border-brand-cyan/25 bg-brand-cyan/5 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      Sugestões para hoje
                    </p>
                    <span className="text-xs text-muted-foreground">
                      Pelo restante
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {macroSuggestedFoods.map((suggestion) => (
                      <button
                        key={suggestion.food.id}
                        type="button"
                        onClick={() =>
                          handleSelectFood(suggestion.food, {
                            qtd: suggestion.suggestedQtd,
                            hint: `Sugestão para hoje: ${formatFoodPortion(
                              suggestion.suggestedQtd,
                              suggestion.food.unidadeReferencia
                            )}`,
                          })
                        }
                        className="rounded-lg border border-border/80 bg-background/70 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                      >
                        <span className="block truncate font-medium">
                          {suggestion.food.descricao}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {suggestion.label} ·{" "}
                          {formatFoodPortion(
                            suggestion.suggestedQtd,
                            suggestion.food.unidadeReferencia
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {!trimmedQuery && hasShortcuts && !pendingFood && (
              <Tabs
                value={activeShortcutTab}
                onValueChange={(value) => setShortcutTab(value as ShortcutTab)}
                className="gap-3"
              >
                <TabsList className="w-full">
                  <TabsTrigger
                    value="smart"
                    className="flex-1"
                    disabled={smartMeals.length === 0}
                  >
                    Agora
                  </TabsTrigger>
                  <TabsTrigger
                    value="recent"
                    className="flex-1"
                    disabled={recentMeals.length === 0}
                  >
                    Recentes
                  </TabsTrigger>
                  <TabsTrigger
                    value="favorite"
                    className="flex-1"
                    disabled={favoriteFoods.length === 0}
                  >
                    Favoritos
                  </TabsTrigger>
                  <TabsTrigger
                    value="combo"
                    className="flex-1"
                    disabled={comboFoods.length === 0}
                  >
                    Combos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="smart" className="mt-0">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Refeições desse horário que você costuma repetir.
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {smartMeals.map((meal) => renderMealTemplateButton(meal))}
                  </div>
                </TabsContent>

                <TabsContent value="recent" className="mt-0">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Toque para trazer todos os itens para o carrinho.
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {recentMeals.map((meal) =>
                      renderMealTemplateButton(meal, { compact: true })
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="favorite" className="mt-0">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {favoriteFoods.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => handleSelectFood(food)}
                        className="rounded-lg border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                      >
                        <span className="block truncate font-medium">
                          {food.descricao}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {Math.round(food.calorias)} kcal / {food.qtdReferencia}
                          {food.unidadeReferencia}
                          {food.vezesUsado > 0 ? ` · ${food.vezesUsado}x` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="combo" className="mt-0">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {comboFoods.map((food) => (
                      <button
                        key={food.id}
                        type="button"
                        onClick={() => handleSelectFood(food)}
                        className="rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-2 text-left text-sm transition-colors hover:bg-cyan/10"
                      >
                        <span className="block truncate font-medium">
                          {food.descricao}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {Math.round(food.calorias)} kcal · P{" "}
                          {Math.round(food.proteinas)}g
                          {food.vezesUsado > 0 ? ` · ${food.vezesUsado}x` : ""}
                        </span>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {isSearching && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Buscando...
              </p>
            )}

            {!isSearching && sortedResults.length > 0 && (
              <ul className="max-h-40 overflow-y-auto rounded-lg border border-border">
                {sortedResults.map((food) => (
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
                        {food.vezesUsado > 0 ? ` · ${food.vezesUsado}x` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {showEmptySearchHint && !showInlineCreate && (
              <div className="rounded-lg border border-dashed border-border px-3 py-3">
                <p className="text-sm text-muted-foreground">
                  Não encontrou &ldquo;{trimmedQuery}&rdquo;?
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={openInlineCreate}
                >
                  <Plus className="size-4" />
                  Criar alimento no banco
                </Button>
              </div>
            )}

            {showInlineCreate && (
              <div className="rounded-lg border border-cyan/30 bg-cyan/5 p-3">
                <p className="text-sm font-medium">Novo alimento</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="inline-descricao">Nome</Label>
                    <Input
                      id="inline-descricao"
                      value={inlineForm.descricao}
                      onChange={(event) =>
                        updateInlineField("descricao", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="inline-qtd">Porção de referência</Label>
                    <Input
                      id="inline-qtd"
                      type="number"
                      min="0"
                      step="any"
                      value={inlineForm.qtdReferencia}
                      onChange={(event) =>
                        updateInlineField(
                          "qtdReferencia",
                          Number(event.target.value.replace(",", "."))
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="inline-unidade">Unidade</Label>
                    <Select
                      value={inlineForm.unidadeReferencia}
                      onValueChange={(value) =>
                        updateInlineField("unidadeReferencia", value)
                      }
                    >
                      <SelectTrigger id="inline-unidade" className="w-full">
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
                  <div>
                    <Label htmlFor="inline-kcal">Calorias</Label>
                    <Input
                      id="inline-kcal"
                      type="number"
                      min="0"
                      step="any"
                      value={inlineForm.calorias}
                      onChange={(event) =>
                        updateInlineField(
                          "calorias",
                          Number(event.target.value.replace(",", "."))
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="inline-prot">Proteína (g)</Label>
                    <Input
                      id="inline-prot"
                      type="number"
                      min="0"
                      step="any"
                      value={inlineForm.proteinas}
                      onChange={(event) =>
                        updateInlineField(
                          "proteinas",
                          Number(event.target.value.replace(",", "."))
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="inline-carb">Carboidrato (g)</Label>
                    <Input
                      id="inline-carb"
                      type="number"
                      min="0"
                      step="any"
                      value={inlineForm.carboidratos}
                      onChange={(event) =>
                        updateInlineField(
                          "carboidratos",
                          Number(event.target.value.replace(",", "."))
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="inline-gord">Gordura (g)</Label>
                    <Input
                      id="inline-gord"
                      type="number"
                      min="0"
                      step="any"
                      value={inlineForm.gorduras}
                      onChange={(event) =>
                        updateInlineField(
                          "gorduras",
                          Number(event.target.value.replace(",", "."))
                        )
                      }
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAnalyzeInlineFood}
                    disabled={
                      isAnalyzingInlineFood ||
                      isCreatingFood ||
                      inlineForm.descricao.trim().length < 2
                    }
                  >
                    {isAnalyzingInlineFood ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Estimando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Preencher com IA
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateInlineFood}
                    disabled={isCreatingFood || isAnalyzingInlineFood}
                  >
                    {isCreatingFood ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar e adicionar ao carrinho"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowInlineCreate(false)}
                  >
                    Cancelar
                  </Button>
                </div>
                {inlineHint ? (
                  <p className="mt-2 text-xs text-brand-cyan" role="status">
                    {inlineHint}
                  </p>
                ) : null}
              </div>
            )}

            {pendingFood && (
              <div className="rounded-lg border border-cyan/30 bg-cyan/5 p-3">
                <p className="text-sm font-medium">{pendingFood.descricao}</p>
                {pendingQtdHint ? (
                  <p className="mt-1 text-xs text-brand-cyan">
                    {pendingQtdHint}
                  </p>
                ) : pendingRecentPortion ? (
                  <p className="mt-1 text-xs text-brand-cyan">
                    Última porção:{" "}
                    {formatFoodPortion(
                      pendingRecentPortion.qtd,
                      pendingRecentPortion.unidade
                    )}
                  </p>
                ) : null}
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
                      onClick={() => {
                        setPendingFood(null)
                        setPendingQtdHint(null)
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <MealModalAiPanel mode="text" onAddItems={handleAddAiItems} />
            </TabsContent>

            <TabsContent value="photo" className="mt-4">
              <MealModalAiPanel mode="photo" onAddItems={handleAddAiItems} />
            </TabsContent>
          </Tabs>

          {supplementPresets.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Suplementos</h3>
              <p className="text-xs text-muted-foreground">
                Opcional — inclua na mesma refeição.
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {supplementPresets.map((preset) => {
                  const isSelected = cart.some(
                    (item) => item.uid === `supp-${preset.id}`
                  )
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => toggleSupplement(preset)}
                      className={cn(
                        "rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                        isSelected
                          ? "border-cyan/50 bg-cyan/10"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <p className="font-medium">{preset.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {Math.round(preset.calorias)} kcal · P{" "}
                        {Math.round(preset.proteinas)}g
                      </p>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          <section className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium">Carrinho</h3>
                <p className="text-xs text-muted-foreground">
                  {cart.length > 0
                    ? `${cart.length} ${cart.length === 1 ? "item" : "itens"} nesta refeição`
                    : "Adicione alimentos para montar a refeição"}
                </p>
              </div>
              {cart.length > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openComboDialog}
                  disabled={isSavingCombo}
                >
                  {isSavingCombo ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Salvando…
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Salvar combo
                    </>
                  )}
                </Button>
              ) : null}
            </div>

            {hasUnsavedAiItems ? (
              <label className="flex items-start gap-2 rounded-lg border border-cyan/30 bg-cyan/5 px-3 py-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={saveAiItemsToBank}
                  onCheckedChange={(checked) =>
                    setSaveAiItemsToBank(checked === true)
                  }
                />
                <span>
                  <span className="block font-medium">
                    Salvar itens da IA no banco
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Eles ficam disponíveis nos favoritos depois desta refeição.
                  </span>
                </span>
              </label>
            ) : null}
            {comboHint ? (
              <p className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-2 text-xs text-brand-cyan">
                {comboHint}
              </p>
            ) : null}

            {cart.length === 0 ? (
              <p className="rounded-lg border border-dashed px-3 py-5 text-center text-sm text-muted-foreground">
                Nenhum item no carrinho.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {cart.map((item) => {
                  const isSupplement = isSupplementCartItem(item)

                  return (
                    <li
                      key={item.uid}
                      className="rounded-lg border border-border px-3 py-2.5"
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

                      <div className="mt-2 flex items-center justify-between gap-2">
                        {isSupplement ? (
                          <span className="rounded-md bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                            1 dose
                          </span>
                        ) : (
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
                        )}

                        {!isSupplement ? (
                          <span className="text-xs text-muted-foreground">
                            +/- {getCartQuantityStep(item)}
                            {item.unidade}
                          </span>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <Dialog
            open={comboDialogOpen}
            onOpenChange={(nextOpen) => {
              setComboDialogOpen(nextOpen)
              if (!nextOpen) setComboError(null)
            }}
          >
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Salvar Combo</DialogTitle>
                <DialogDescription>
                  Guarde este carrinho como atalho no banco de alimentos.
                </DialogDescription>
              </DialogHeader>

              <form
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  handleSaveCombo()
                }}
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="combo-name">Nome do combo</Label>
                  <Input
                    id="combo-name"
                    name="combo-name"
                    value={comboName}
                    onChange={(event) => {
                      setComboName(event.target.value)
                      setComboError(null)
                    }}
                    placeholder="Ex.: Café padrão…"
                    autoComplete="off"
                  />
                </div>

                <div className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
                  {Math.round(totals.calorias)} kcal · P{" "}
                  {Math.round(totals.proteinas)}g · C{" "}
                  {Math.round(totals.carboidratos)}g · G{" "}
                  {Math.round(totals.gorduras)}g
                </div>

                {comboError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {comboError}
                  </p>
                ) : null}

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setComboDialogOpen(false)}
                    disabled={isSavingCombo}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSavingCombo}>
                    {isSavingCombo ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Salvando…
                      </>
                    ) : (
                      "Salvar Combo"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="w-full rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground sm:mr-auto sm:w-auto">
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
            disabled={isSaving || cart.length === 0}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Salvando…
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
