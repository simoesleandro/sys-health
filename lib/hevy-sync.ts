import type { SupabaseClient } from "@supabase/supabase-js"

import {
  fetchHevyWorkoutsPage,
  HEVY_MAX_PAGE_SIZE,
  mapHevyWorkoutToRow,
} from "@/lib/hevy-api"
import { getHevyApiKey } from "@/lib/sync-env"

export type HevySyncResult =
  | { success: true; message: string }
  | { success: false; error: string }

/**
 * Busca todos os treinos Hevy paginando até `maxPages`.
 * Módulo puro (sem `next/headers`) — pode ser importado por route handlers.
 */
export async function fetchAllHevyRows(apiKey: string, maxPages: number) {
  const allRows: ReturnType<typeof mapHevyWorkoutToRow>[] = []

  for (let page = 1; page <= maxPages; page++) {
    const { workouts, pageCount } = await fetchHevyWorkoutsPage(
      apiKey,
      page,
      HEVY_MAX_PAGE_SIZE
    )

    for (const workout of workouts) {
      allRows.push(mapHevyWorkoutToRow(workout))
    }

    if (page >= pageCount) break
  }

  return allRows
}

/**
 * Sincroniza treinos Hevy sem uma sessão de utilizador — usado pelo cron
 * (`app/api/cron/hevy`). Recebe o cliente Supabase por parâmetro para não
 * depender de `lib/supabase/server` (que importa `next/headers` e quebra o
 * build da rota). O caller deve passar um client com service role e o
 * `userId` do dono dos dados (a chave Hevy é global/single-tenant).
 */
export async function syncHevyDataForUser(
  userId: string,
  supabase: SupabaseClient,
  maxPages = 20
): Promise<HevySyncResult> {
  if (!userId) {
    return { success: false, error: "userId obrigatório para sync sem sessão." }
  }

  const apiKey = getHevyApiKey()
  if (!apiKey) {
    return { success: false, error: "HEVY_API_KEY não configurado." }
  }

  try {
    const allRows = await fetchAllHevyRows(apiKey, maxPages)

    if (!allRows.length) {
      return {
        success: false,
        error: "Nenhum treino encontrado na API do Hevy.",
      }
    }

    const { error } = await supabase.from("hevy_treinos").upsert(
      allRows.map((row) => ({ ...row, user_id: userId })),
      { onConflict: "id" }
    )
    if (error) throw error

    return {
      success: true,
      message: `${allRows.length} treino(s) Hevy sincronizado(s).`,
    }
  } catch (error) {
    console.error("[syncHevyDataForUser]", error)
    const detail =
      error instanceof Error && error.message
        ? error.message
        : "Erro desconhecido."
    return {
      success: false,
      error: `Não foi possível sincronizar treinos do Hevy. ${detail}`,
    }
  }
}
