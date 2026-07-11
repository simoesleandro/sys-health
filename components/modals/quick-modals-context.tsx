"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"

import type { MeasurementInput } from "@/lib/biometry"
import { fetchTodayMealsForPicker } from "@/lib/actions/meals"
import type { NutritionGoals } from "@/lib/goals"
import type { SupplementPreset } from "@/lib/supplements"

type QuickModalsContextValue = {
  mealOpen: boolean
  setMealOpen: (open: boolean) => void
  openMealModal: () => void
  waterOpen: boolean
  setWaterOpen: (open: boolean) => void
  openWaterModal: () => void
  supplementOpen: boolean
  setSupplementOpen: (open: boolean) => void
  openSupplementModal: () => void
  biometryOpen: boolean
  setBiometryOpen: (open: boolean) => void
  openBiometryModal: () => void
  editMealOpen: boolean
  editMealId: number | null
  setEditMealOpen: (open: boolean) => void
  openEditMeal: (mealId: number) => void
  editMealsPickerOpen: boolean
  setEditMealsPickerOpen: (open: boolean) => void
  openEditMealsPicker: () => void
  openEditMealsFlow: () => void
  todayMeasurementForm: MeasurementInput
  nutritionGoals: NutritionGoals
  supplementPresets: SupplementPreset[]
  showFeedback: (message: string) => void
}

const QuickModalsContext = React.createContext<QuickModalsContextValue | null>(
  null
)

export function QuickModalsProvider({
  children,
  todayMeasurementForm,
  nutritionGoals,
  supplementPresets,
}: {
  children: React.ReactNode
  todayMeasurementForm: MeasurementInput
  nutritionGoals: NutritionGoals
  supplementPresets: SupplementPreset[]
}) {
  const [mealOpen, setMealOpen] = React.useState(false)
  const [waterOpen, setWaterOpen] = React.useState(false)
  const [supplementOpen, setSupplementOpen] = React.useState(false)
  const [biometryOpen, setBiometryOpen] = React.useState(false)
  const [editMealOpen, setEditMealOpenState] = React.useState(false)
  const [editMealId, setEditMealId] = React.useState<number | null>(null)
  const [editMealsPickerOpen, setEditMealsPickerOpen] = React.useState(false)
  const [feedback, setFeedback] = React.useState<string | null>(null)

  const showFeedback = React.useCallback((message: string) => {
    setFeedback(message)
  }, [])

  React.useEffect(() => {
    if (!feedback) return

    const timer = window.setTimeout(() => setFeedback(null), 3600)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const setEditMealOpen = React.useCallback((open: boolean) => {
    setEditMealOpenState(open)
    if (!open) setEditMealId(null)
  }, [])

  const openEditMeal = React.useCallback((mealId: number) => {
    setEditMealId(mealId)
    setEditMealOpenState(true)
  }, [])

  const openEditMealsFlow = React.useCallback(() => {
    void fetchTodayMealsForPicker().then((meals) => {
      if (meals.length === 1) {
        openEditMeal(meals[0].id)
        return
      }
      setEditMealsPickerOpen(true)
    })
  }, [openEditMeal])

  const value = React.useMemo(
    () => ({
      mealOpen,
      setMealOpen,
      openMealModal: () => setMealOpen(true),
      waterOpen,
      setWaterOpen,
      openWaterModal: () => setWaterOpen(true),
      supplementOpen,
      setSupplementOpen,
      openSupplementModal: () => setSupplementOpen(true),
      biometryOpen,
      setBiometryOpen,
      openBiometryModal: () => setBiometryOpen(true),
      editMealOpen,
      editMealId,
      setEditMealOpen,
      openEditMeal,
      editMealsPickerOpen,
      setEditMealsPickerOpen,
      openEditMealsPicker: () => setEditMealsPickerOpen(true),
      openEditMealsFlow,
      todayMeasurementForm,
      nutritionGoals,
      supplementPresets,
      showFeedback,
    }),
    [
      mealOpen,
      waterOpen,
      supplementOpen,
      biometryOpen,
      editMealOpen,
      editMealId,
      setEditMealOpen,
      openEditMeal,
      editMealsPickerOpen,
      openEditMealsFlow,
      todayMeasurementForm,
      nutritionGoals,
      supplementPresets,
      showFeedback,
    ]
  )

  return (
    <QuickModalsContext.Provider value={value}>
      {children}
      {feedback ? (
        <div
          className="fixed inset-x-3 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-2 rounded-full border border-brand-cyan/30 bg-zinc-950/95 px-3 py-2 text-sm text-white shadow-2xl shadow-brand-cyan/15 backdrop-blur"
          role="status"
          aria-live="polite"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-cyan/15 text-brand-cyan">
            <CheckCircle2 className="size-4" />
          </span>
          <span className="min-w-0 truncate">{feedback}</span>
        </div>
      ) : null}
    </QuickModalsContext.Provider>
  )
}

export function useQuickModals() {
  const context = React.useContext(QuickModalsContext)
  if (!context) {
    throw new Error("useQuickModals deve ser usado dentro de QuickModalsProvider")
  }
  return context
}

export function useMealModal() {
  const { mealOpen, setMealOpen, openMealModal } = useQuickModals()
  return { open: mealOpen, setOpen: setMealOpen, openMealModal }
}

export function useEditMealModal() {
  const { editMealOpen, editMealId, setEditMealOpen, openEditMeal } =
    useQuickModals()
  return {
    open: editMealOpen,
    mealId: editMealId,
    setOpen: setEditMealOpen,
    openEditMeal,
  }
}

export function useEditMealsPickerModal() {
  const { editMealsPickerOpen, setEditMealsPickerOpen, openEditMealsPicker } =
    useQuickModals()
  return {
    open: editMealsPickerOpen,
    setOpen: setEditMealsPickerOpen,
    openEditMealsPicker,
  }
}
