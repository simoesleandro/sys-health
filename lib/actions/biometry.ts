"use server"

import { revalidatePath } from "next/cache"

import type { MeasurementInput } from "@/lib/biometry"
import { getBrtTodayUtcBounds } from "@/lib/data"
import { createServerSupabase } from "@/lib/supabase/server"

function sanitizeMeasurementValue(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value < 0) return null
  return value
}

function buildMeasurementPayload(data: MeasurementInput) {
  return {
    peso: sanitizeMeasurementValue(data.peso),
    cintura: sanitizeMeasurementValue(data.cintura),
    abdomen: sanitizeMeasurementValue(data.abdomen),
    peitoral: sanitizeMeasurementValue(data.peitoral),
    quadril: sanitizeMeasurementValue(data.quadril),
    coxa_dir: sanitizeMeasurementValue(data.coxa_dir),
    coxa_esq: sanitizeMeasurementValue(data.coxa_esq),
    panturrilha_dir: sanitizeMeasurementValue(data.panturrilha_dir),
    panturrilha_esq: sanitizeMeasurementValue(data.panturrilha_esq),
    biceps_dir: sanitizeMeasurementValue(data.biceps_dir),
    biceps_esq: sanitizeMeasurementValue(data.biceps_esq),
  }
}

function hasAnyMeasurementValue(payload: ReturnType<typeof buildMeasurementPayload>) {
  return Object.values(payload).some((value) => value != null)
}

export async function saveMeasurement(data: MeasurementInput) {
  const payload = buildMeasurementPayload(data)

  if (!hasAnyMeasurementValue(payload)) {
    return {
      success: false as const,
      error: "Informe pelo menos uma medida válida.",
    }
  }

  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  const { brtDate } = getBrtTodayUtcBounds()

  try {
    const { data: existing, error: lookupError } = await supabase
      .from("medidas")
      .select("id")
      .eq("data", brtDate)
      .maybeSingle()

    if (lookupError) throw lookupError

    if (existing?.id) {
      const { error } = await supabase
        .from("medidas")
        .update(payload)
        .eq("id", existing.id)

      if (error) throw error
    } else {
      const { error } = await supabase.from("medidas").insert({
        data: brtDate,
        ...payload,
      })

      if (error) throw error
    }

    revalidatePath("/")
    revalidatePath("/evolucao")
    revalidatePath("/biometria")

    return { success: true as const }
  } catch (error) {
    console.error("[saveMeasurement]", error)
    return {
      success: false as const,
      error: "Não foi possível salvar as medidas.",
    }
  }
}
