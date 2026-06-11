"use server"

import { revalidatePath } from "next/cache"

import type { NutritionGoals } from "@/lib/goals"
import {
  buildSupplementConfigsFromProduct,
  productGroupKeyFromInput,
  productGroupKeysMatch,
  type GeneratedSupplementConfig,
} from "@/lib/supplements"
import type {
  SupplementConfigInput,
  SupplementProductInput,
  UserSupplementConfig,
} from "@/lib/user-settings"
import { getUserSupplementConfigs } from "@/lib/user-settings"
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

function mapGeneratedToRow(
  userId: string,
  item: GeneratedSupplementConfig,
  sortOrder: number,
  ativo: boolean
) {
  return {
    user_id: userId,
    preset_id: item.presetId,
    nome: item.nome,
    marca: item.marca,
    dose: item.dose,
    cor_tema: item.corTema,
    label: item.label,
    descricao: item.descricao,
    calorias: item.calorias,
    proteinas: item.proteinas,
    carboidratos: item.carboidratos,
    gorduras: item.gorduras,
    sort_order: sortOrder,
    ativo,
  }
}

function productGroupKey(item: UserSupplementConfig) {
  return productGroupKeyFromInput(item.nome, item.marca)
}

export async function createSupplementFromProduct(
  data: SupplementProductInput
): Promise<ActionResult> {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return { success: false, error: auth.error ?? "Sessão inválida." }
  }

  const nome = data.nome.trim()
  const marca = data.marca.trim()
  if (!nome) {
    return { success: false, error: "Informe o nome do produto." }
  }
  if (!marca) {
    return { success: false, error: "Informe a marca." }
  }

  const existing = await getUserSupplementConfigs()
  const incomingKey = productGroupKeyFromInput(nome, marca)
  const alreadyExists = existing.some((item) =>
    productGroupKeysMatch(productGroupKey(item), incomingKey)
  )
  if (alreadyExists) {
    return {
      success: false,
      error:
        "Este produto e marca já estão cadastrados. Edite o existente em Configurações.",
    }
  }

  const existingIds = new Set(existing.map((item) => item.id))
  const nextSort =
    Math.max(0, ...existing.map((item) => item.sortOrder)) + 1

  const generated = buildSupplementConfigsFromProduct(nome, marca, {
    existingPresetIds: existingIds,
    sortOrder: nextSort,
  })

  if (!generated.length) {
    return { success: false, error: "Não foi possível gerar o suplemento." }
  }

  const rows = generated.map((item, index) =>
    mapGeneratedToRow(auth.user!.id, item, nextSort + index, data.ativo !== false)
  )

  const { error } = await auth.supabase.from("suplementos_config").insert(rows)
  if (error) {
    console.error("[createSupplementFromProduct]", error)
    if (error.code === "23505") {
      return {
        success: false,
        error: "Já existe um suplemento com este produto e marca.",
      }
    }
    return { success: false, error: "Não foi possível criar o suplemento." }
  }

  revalidateSettingsPaths()
  return { success: true }
}

export async function updateSupplementProduct(
  dbId: number,
  data: SupplementProductInput
): Promise<ActionResult> {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return { success: false, error: auth.error ?? "Sessão inválida." }
  }

  const nome = data.nome.trim()
  const marca = data.marca.trim()
  if (!nome) {
    return { success: false, error: "Informe o nome do produto." }
  }
  if (!marca) {
    return { success: false, error: "Informe a marca." }
  }

  const existing = await getUserSupplementConfigs()
  const target = existing.find((item) => item.dbId === dbId)
  if (!target) {
    return { success: false, error: "Suplemento não encontrado." }
  }

  const groupKey = productGroupKey(target)
  const siblings = existing.filter(
    (item) => productGroupKey(item) === groupKey
  )
  const otherIds = new Set(
    existing
      .filter((item) => productGroupKey(item) !== groupKey)
      .map((item) => item.id)
  )

  const generated = buildSupplementConfigsFromProduct(nome, marca, {
    existingPresetIds: otherIds,
    sortOrder: siblings[0]?.sortOrder ?? 0,
  })

  if (!generated.length) {
    return { success: false, error: "Não foi possível atualizar o suplemento." }
  }

  const sortedSiblings = [...siblings].sort((a, b) => a.id.localeCompare(b.id))

  if (sortedSiblings.length > 1) {
    const toRemove = sortedSiblings.slice(1)
    const { error: deleteError } = await auth.supabase
      .from("suplementos_config")
      .delete()
      .in(
        "id",
        toRemove.map((item) => item.dbId)
      )
      .eq("user_id", auth.user.id)

    if (deleteError) {
      console.error("[updateSupplementProduct/delete]", deleteError)
      return { success: false, error: "Não foi possível atualizar doses." }
    }
  }

  const updates = generated.slice(0, 1)
  for (let index = 0; index < updates.length; index += 1) {
    const generatedSlot = updates[index]
    const sibling = sortedSiblings[index]

    const payload = mapGeneratedToRow(
      auth.user.id,
      {
        ...generatedSlot,
        presetId: sibling?.id ?? generatedSlot.presetId,
      },
      (sibling?.sortOrder ?? sortedSiblings[0]?.sortOrder ?? 0) + index,
      data.ativo !== false
    )

    if (sibling) {
      const { error } = await auth.supabase
        .from("suplementos_config")
        .update(payload)
        .eq("id", sibling.dbId)
        .eq("user_id", auth.user.id)

      if (error) {
        console.error("[updateSupplementProduct/update]", error)
        return { success: false, error: "Não foi possível atualizar o suplemento." }
      }
    } else {
      const { error } = await auth.supabase
        .from("suplementos_config")
        .insert(payload)

      if (error) {
        console.error("[updateSupplementProduct/insert]", error)
        return { success: false, error: "Não foi possível criar dose adicional." }
      }
    }
  }

  revalidateSettingsPaths()
  return { success: true }
}

export async function deleteSupplementProductGroup(
  dbId: number
): Promise<ActionResult> {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase || !auth.user) {
    return { success: false, error: auth.error ?? "Sessão inválida." }
  }

  const existing = await getUserSupplementConfigs()
  const target = existing.find((item) => item.dbId === dbId)
  if (!target) {
    return { success: false, error: "Suplemento não encontrado." }
  }

  const groupKey = productGroupKey(target)
  const dbIds = existing
    .filter((item) => productGroupKey(item) === groupKey)
    .map((item) => item.dbId)

  const { error } = await auth.supabase
    .from("suplementos_config")
    .delete()
    .in("id", dbIds)
    .eq("user_id", auth.user.id)

  if (error) {
    console.error("[deleteSupplementProductGroup]", error)
    return { success: false, error: "Não foi possível apagar o suplemento." }
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
