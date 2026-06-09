"use client"

import * as React from "react"

import type { MeasurementInput } from "@/lib/biometry"
import { fetchTodayMealsForPicker } from "@/lib/actions/meals"

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
}

const QuickModalsContext = React.createContext<QuickModalsContextValue | null>(
  null
)

export function QuickModalsProvider({
  children,
  todayMeasurementForm,
}: {
  children: React.ReactNode
  todayMeasurementForm: MeasurementInput
}) {
  const [mealOpen, setMealOpen] = React.useState(false)
  const [waterOpen, setWaterOpen] = React.useState(false)
  const [supplementOpen, setSupplementOpen] = React.useState(false)
  const [biometryOpen, setBiometryOpen] = React.useState(false)
  const [editMealOpen, setEditMealOpenState] = React.useState(false)
  const [editMealId, setEditMealId] = React.useState<number | null>(null)
  const [editMealsPickerOpen, setEditMealsPickerOpen] = React.useState(false)

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
    ]
  )

  return (
    <QuickModalsContext.Provider value={value}>
      {children}
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
