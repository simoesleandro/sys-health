"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveNutritionGoals } from "@/lib/actions/settings"
import type { NutritionGoals } from "@/lib/goals"

const FIELDS: {
  key: keyof NutritionGoals
  label: string
  step: string
  unit?: string
}[] = [
  { key: "TMB_KCAL", label: "TMB (calorias)", step: "1" },
  { key: "PROTEIN_G", label: "Proteína", step: "1", unit: "g" },
  { key: "CARBS_G", label: "Carboidratos", step: "1", unit: "g" },
  { key: "FATS_G", label: "Gorduras", step: "1", unit: "g" },
  { key: "WATER_L", label: "Água", step: "0.1", unit: "L" },
  { key: "PAI", label: "PAI (meta)", step: "1" },
]

export function GoalsForm({ initialGoals }: { initialGoals: NutritionGoals }) {
  const router = useRouter()
  const [goals, setGoals] = useState(initialGoals)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function updateField(key: keyof NutritionGoals, value: string) {
    setGoals((prev) => ({
      ...prev,
      [key]: Number(value),
    }))
    setSaved(false)
    setError(null)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await saveNutritionGoals(goals)
      if (!result.success) {
        setError(result.error)
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label}
              {field.unit ? ` (${field.unit})` : ""}
            </Label>
            <Input
              id={field.key}
              type="number"
              step={field.step}
              min={0}
              required
              value={goals[field.key]}
              onChange={(event) => updateField(field.key, event.target.value)}
              className="border-zinc-800/70 bg-black/40"
            />
          </div>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-brand-cyan">Metas salvas com sucesso.</p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="bg-brand-cyan font-semibold text-black hover:bg-brand-cyan/90"
      >
        {isPending ? "Salvando…" : "Salvar metas"}
      </Button>
    </form>
  )
}
