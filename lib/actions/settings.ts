"use server"

import { revalidatePath } from "next/cache"

import type { NutritionGoals } from "@/lib/goals"
import type { SupplementConfigInput } from "@/lib/user-settings"
import { requireAuth } from "@/lib/supabase/auth"
import type { SupplementTheme } from "@/lib/supplements"

type ActionResult =
  | { success: true }
  | { success: false; error: string }

const SUPPLEMENT_THEMES: SupplementTheme[] = [
  "green",
  "cyan",
  "yellow",
  "magenta",
  "purple",
  "orange",
]

function sanitizeGoalNumber(value: number, fallback: number) {
  if (!Number.isFinite(value) || value < 0) return fallback
  return value
}

function sanitizeSupplementInput(data: SupplementConfigInput) {
  const presetId = data.presetId.trim().toLowerCase().replace(/\s+/g, "-")
  if (!presetId) {
    return { ok: false as const, error: "Informe um identificador (slug)." }
  }

  if (!data.nome.trim() || !data.label.trim() || !data.descricao.trim()) {
    return {
      ok: false as const,
      error: "Nome, rótulo e descrição são obrigatórios.",
    }
  }

  const corTema = SUPPLEMENT_THEMES.includes(data.corTema)
    ? data.corTema
    : "cyan"

  return {
    ok: true as const,
    value: {
      preset_id: presetId,
      nome: data.nome.trim(),
      marca: data.marca.trim(),
      dose: data.dose.trim(),
      cor_tema: corTema,
      label: data.label.trim(),
      descricao: data.descricao.trim(),
      calorias: Math.max(0, Number(data.calorias) || 0),
      proteinas: Math.max(0, Number(data.proteinas) || 0),
      carboidratos: Math.max(0, Number(data.carboidratos) || 0),
      gorduras: Math.max(0, Number(data.gorduras) || 0),
      sort_order: Math.max(0, Math.round(data.sortOrder) || 0),
      ativo: data.ativo,
    },
  }
}

function revalidateSettingsPaths() {
  revalidatePath("/configuracoes")
  revalidatePath("/")
  revalidatePath("/evolucao")
  revalidatePath("/registros")
}

export async function saveNutritionGoals(
  goals: NutritionGoals
): Promise<ActionResult> {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return { success: false, error: auth.error ?? "Sessão inválida." }
  }

  const payload = {
    user_id: auth.user.id,
    tmb_kcal: sanitizeGoalNumber(goals.TMB_KCAL, 1863),
    protein_g: sanitizeGoalNumber(goals.PROTEIN_G, 190),
    carbs_g: sanitizeGoalNumber(goals.CARBS_G, 180),
    fats_g: sanitizeGoalNumber(goals.FATS_G, 65),
    water_l: sanitizeGoalNumber(goals.WATER_L, 3.5),
    pai: Math.round(sanitizeGoalNumber(goals.PAI, 100)),
    updated_at: new Date().toISOString(),
  }

  const { error } = await auth.supabase
    .from("metas_usuario")
    .upsert(payload, { onConflict: "user_id" })

  if (error) {
    console.error("[saveNutritionGoals]", error)
    return { success: false, error: "Não foi possível salvar as metas." }
  }

  revalidateSettingsPaths()
  return { success: true }
}

export async function createSupplementConfig(
  data: SupplementConfigInput
): Promise<ActionResult> {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return { success: false, error: auth.error ?? "Sessão inválida." }
  }

  const validation = sanitizeSupplementInput(data)
  if (!validation.ok) return { success: false, error: validation.error }

  const { error } = await auth.supabase.from("suplementos_config").insert({
    user_id: auth.user.id,
    ...validation.value,
  })

  if (error) {
    console.error("[createSupplementConfig]", error)
    if (error.code === "23505") {
      return {
        success: false,
        error: "Já existe um suplemento com este identificador.",
      }
    }
    return { success: false, error: "Não foi possível criar o suplemento." }
  }

  revalidateSettingsPaths()
  return { success: true }
}

export async function updateSupplementConfig(
  dbId: number,
  data: SupplementConfigInput
): Promise<ActionResult> {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return { success: false, error: auth.error ?? "Sessão inválida." }
  }

  const validation = sanitizeSupplementInput(data)
  if (!validation.ok) return { success: false, error: validation.error }

  const { error } = await auth.supabase
    .from("suplementos_config")
    .update({
      ...validation.value,
    })
    .eq("id", dbId)
    .eq("user_id", auth.user.id)

  if (error) {
    console.error("[updateSupplementConfig]", error)
    return { success: false, error: "Não foi possível atualizar o suplemento." }
  }

  revalidateSettingsPaths()
  return { success: true }
}

export async function deleteSupplementConfig(dbId: number): Promise<ActionResult> {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return { success: false, error: auth.error ?? "Sessão inválida." }
  }

  const { error } = await auth.supabase
    .from("suplementos_config")
    .delete()
    .eq("id", dbId)
    .eq("user_id", auth.user.id)

  if (error) {
    console.error("[deleteSupplementConfig]", error)
    return { success: false, error: "Não foi possível apagar o suplemento." }
  }

  revalidateSettingsPaths()
  return { success: true }
}
