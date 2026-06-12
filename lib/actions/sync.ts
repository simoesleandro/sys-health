"use server"

import { revalidatePath } from "next/cache"

import { getBrtTodayUtcBounds } from "@/lib/brt-time"
import { requireAuth } from "@/lib/supabase/auth"
import {
  createServerSupabase,
  createServiceSupabase,
  type ServerSupabaseClient,
} from "@/lib/supabase/server"
import {
  fetchHevyWorkoutsPage,
  HEVY_MAX_PAGE_SIZE,
  mapHevyWorkoutToRow,
} from "@/lib/hevy-api"
import { getHevyApiKey, getZeppAppToken, getZeppUserId } from "@/lib/sync-env"
import {
  fetchZeppBandSummary,
  fetchZeppHrvPaiForDay,
  fetchZeppWorkoutHistory,
  mapZeppSummaryToRow,
  mapZeppWorkoutApiItem,
  type ZeppAmazfitRow,
  type ZeppWorkoutRow,
} from "@/lib/zepp-api"

type SyncActionResult =
  | { success: true; message: string }
  | { success: false; error: string }

type SyncZeppWorkoutsOptions = {
  /** Quando encadeado após syncZeppData, período sem treinos não falha o sync. */
  allowEmpty?: boolean
  /** Evita revalidate duplicado quando o caller já revalida as rotas. */
  skipRevalidate?: boolean
}

async function fetchExistingZeppRow(
  dayString: string,
  supabase: ServerSupabaseClient,
  userId: string
) {
  const { data } = await supabase
    .from("amazfit_dados")
    .select("hrv_ms, pai, sono_total_min, sono_profundo_min")
    .eq("data_hora", `${dayString} 00:00:00`)
    .eq("user_id", userId)
    .maybeSingle()

  return {
    hrv_ms: data?.hrv_ms == null ? 0 : Number(data.hrv_ms),
    pai: data?.pai == null ? 0 : Number(data.pai),
    sono_total_min:
      data?.sono_total_min == null ? 0 : Number(data.sono_total_min),
    sono_profundo_min:
      data?.sono_profundo_min == null ? 0 : Number(data.sono_profundo_min),
  }
}

async function saveZeppRow(row: ZeppAmazfitRow, userId: string) {
  const sessionSupabase = await createServerSupabase()
  const serviceSupabase = createServiceSupabase()
  const supabase = serviceSupabase ?? sessionSupabase

  if (!supabase) {
    throw new Error("Supabase não configurado.")
  }

  const payload = { ...row, user_id: userId }

  if (serviceSupabase) {
    const { error: deleteError } = await serviceSupabase
      .from("amazfit_dados")
      .delete()
      .eq("data_hora", row.data_hora)

    if (deleteError) throw deleteError

    const { error: upsertError } = await serviceSupabase
      .from("amazfit_dados")
      .upsert(payload, { onConflict: "data_hora" })

    if (upsertError) throw upsertError
    return
  }

  if (!sessionSupabase) {
    throw new Error("Supabase não configurado.")
  }

  const { error: deleteError } = await sessionSupabase
    .from("amazfit_dados")
    .delete()
    .eq("data_hora", row.data_hora)
    .eq("user_id", userId)

  if (deleteError) throw deleteError

  const { error: insertError } = await sessionSupabase
    .from("amazfit_dados")
    .insert(payload)

  if (insertError) throw insertError
}

export async function syncZeppData(
  dayString?: string
): Promise<SyncActionResult> {
  const auth = await requireAuth()
  if (!auth.user) {
    return { success: false, error: auth.error }
  }

  const day = dayString ?? getBrtTodayUtcBounds().brtDate
  const appToken = getZeppAppToken()
  const zeppUserId = getZeppUserId()

  if (!appToken) {
    return {
      success: false,
      error: "ZEPP_APP_TOKEN (ou ZEPP_BEARER_TOKEN) não configurado.",
    }
  }

  if (!zeppUserId) {
    return { success: false, error: "ZEPP_USER_ID não configurado." }
  }

  try {
    console.log("[syncZeppData] iniciando fetch Zepp:", {
      day,
      zeppUserId,
      authUserId: auth.user.id,
    })

    const [summary, hrvPaiFromApi, existing] = await Promise.all([
      fetchZeppBandSummary(day, appToken, zeppUserId),
      fetchZeppHrvPaiForDay(day, appToken, zeppUserId),
      fetchExistingZeppRow(day, auth.supabase, auth.user.id),
    ])

    if (!summary || Object.keys(summary).length === 0) {
      console.log("[syncZeppData] sem dados para o dia:", day)
      return {
        success: false,
        error: `Zepp não retornou dados para ${day}.`,
      }
    }

    const row = mapZeppSummaryToRow(day, summary, {
      existing,
      hrvMs: hrvPaiFromApi.hrv_ms,
      pai: hrvPaiFromApi.pai,
    })

    console.log("[syncZeppData] linha mapeada:", row, {
      hrvPaiFromApi,
      preservedFromDb: existing,
    })

    await saveZeppRow(row, auth.user.id)

    console.log("[syncZeppData] resumo salvo — iniciando sync de treinos detalhados")
    const workoutsResult = await syncZeppWorkouts(90, {
      allowEmpty: true,
      skipRevalidate: true,
      userId: auth.user.id,
    })

    revalidatePath("/", "layout")
    revalidatePath("/evolucao")
    revalidatePath("/treinos")
    revalidatePath("/historico")
    revalidatePath("/")

    const recoveryParts = [
      row.hrv_ms > 0 ? `HRV ${row.hrv_ms} ms` : null,
      row.pai > 0 ? `PAI ${row.pai}` : null,
    ].filter(Boolean)

    const baseMessage =
      recoveryParts.length > 0
        ? `Zepp sincronizado — ${row.passos} passos, ${row.sono_total_min} min sono, ${recoveryParts.join(", ")}.`
        : `Zepp sincronizado — ${row.passos} passos, ${row.sono_total_min} min sono.`
    const workoutsMessage = workoutsResult.success
      ? workoutsResult.message
      : `Treinos: ${workoutsResult.error}`

    return {
      success: true,
      message: `${baseMessage} ${workoutsMessage}`,
    }
  } catch (error) {
    console.error("[syncZeppData]", error)
    const detail =
      error instanceof Error && error.message ? error.message : null
    return {
      success: false,
      error:
        detail ??
        "Não foi possível sincronizar dados do Zepp/Amazfit.",
    }
  }
}

async function upsertZeppWorkouts(rows: ZeppWorkoutRow[], userId: string) {
  const sessionSupabase = await createServerSupabase()
  const serviceSupabase = createServiceSupabase()
  const supabase = serviceSupabase ?? sessionSupabase

  if (!supabase) {
    throw new Error("Supabase não configurado.")
  }

  const payload = rows.map((row) => ({
    ...row,
    user_id: userId,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from("amazfit_workouts")
    .upsert(payload, { onConflict: "track_id" })

  if (error) throw error
}

export async function syncZeppWorkouts(
  daysBack = 90,
  options: SyncZeppWorkoutsOptions & { userId?: string } = {}
): Promise<SyncActionResult> {
  const { allowEmpty = false, skipRevalidate = false, userId: userIdOption } =
    options

  const auth = userIdOption
    ? null
    : await requireAuth()
  const authUserId = userIdOption ?? auth?.user?.id

  if (!authUserId) {
    return {
      success: false,
      error: auth?.error ?? "Sessão inválida. Faça login novamente.",
    }
  }

  const appToken = getZeppAppToken()
  const zeppUserId = getZeppUserId()

  if (!appToken) {
    return {
      success: false,
      error: "ZEPP_APP_TOKEN (ou ZEPP_BEARER_TOKEN) não configurado.",
    }
  }

  if (!zeppUserId) {
    return { success: false, error: "ZEPP_USER_ID não configurado." }
  }

  try {
    const stopTrackId = Math.floor(Date.now() / 1000)
    const startTrackId = stopTrackId - daysBack * 24 * 60 * 60

    console.log("[syncZeppWorkouts] fetch Zepp history:", {
      zeppUserId,
      authUserId,
      startTrackId,
      stopTrackId,
      daysBack,
    })

    const summary = await fetchZeppWorkoutHistory(
      appToken,
      zeppUserId,
      startTrackId,
      stopTrackId
    )

    const rows = summary
      .map((item) => mapZeppWorkoutApiItem(item))
      .filter((row): row is ZeppWorkoutRow => row != null && row.distancia_km > 0)

    console.log("[syncZeppWorkouts] treinos mapeados:", {
      received: summary.length,
      saved: rows.length,
      sample: rows[0] ?? null,
    })

    if (!rows.length) {
      if (allowEmpty) {
        return {
          success: true,
          message: "Nenhum treino Zepp no período.",
        }
      }

      return {
        success: false,
        error: "Nenhum treino Zepp encontrado no período.",
      }
    }

    await upsertZeppWorkouts(rows, authUserId)

    if (!skipRevalidate) {
      revalidatePath("/", "layout")
      revalidatePath("/treinos")
      revalidatePath("/evolucao")
      revalidatePath("/")
    }

    return {
      success: true,
      message: `${rows.length} treino(s) Zepp sincronizado(s).`,
    }
  } catch (error) {
    console.error("[syncZeppWorkouts]", error)
    const detail =
      error instanceof Error && error.message ? error.message : null
    return {
      success: false,
      error:
        detail ??
        "Não foi possível sincronizar treinos detalhados do Zepp.",
    }
  }
}

async function upsertHevyWorkoutsWithSession(
  rows: ReturnType<typeof mapHevyWorkoutToRow>[],
  userId: string,
  supabase: ServerSupabaseClient
) {
  const payload = rows.map((row) => ({ ...row, user_id: userId }))

  const { data: owned, error: selectError } = await supabase
    .from("hevy_treinos")
    .select("id")
    .eq("user_id", userId)

  if (selectError) throw selectError

  const ownedIds = new Set((owned ?? []).map((row) => String(row.id)))
  const toInsert = payload.filter((row) => !ownedIds.has(row.id))
  const toUpdate = payload.filter((row) => ownedIds.has(row.id))

  if (toInsert.length) {
    const { error } = await supabase.from("hevy_treinos").insert(toInsert)
    if (error) {
      if (error.code === "23505") {
        throw new Error(
          "Há treinos antigos no banco sem user_id. Adicione SUPABASE_SERVICE_ROLE_KEY no .env.local (Supabase → Settings → API → service_role) e tente de novo."
        )
      }
      throw error
    }
  }

  if (toUpdate.length) {
    const { error } = await supabase
      .from("hevy_treinos")
      .upsert(toUpdate, { onConflict: "id" })

    if (error) throw error
  }
}

async function upsertHevyWorkouts(
  rows: ReturnType<typeof mapHevyWorkoutToRow>[],
  userId: string,
  sessionSupabase: ServerSupabaseClient
) {
  const serviceSupabase = createServiceSupabase()

  if (serviceSupabase) {
    const { error } = await serviceSupabase.from("hevy_treinos").upsert(
      rows.map((row) => ({ ...row, user_id: userId })),
      { onConflict: "id" }
    )
    if (error) throw error
    return
  }

  await upsertHevyWorkoutsWithSession(rows, userId, sessionSupabase)
}

export async function syncHevyData(
  maxPages = 20
): Promise<SyncActionResult> {
  const auth = await requireAuth()
  if (!auth.user) {
    return { success: false, error: auth.error }
  }

  const apiKey = getHevyApiKey()

  if (!apiKey) {
    return { success: false, error: "HEVY_API_KEY não configurado." }
  }

  try {
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

    if (!allRows.length) {
      return {
        success: false,
        error: "Nenhum treino encontrado na API do Hevy.",
      }
    }

    await upsertHevyWorkouts(allRows, auth.user.id, auth.supabase)

    revalidatePath("/", "layout")
    revalidatePath("/treinos")
    revalidatePath("/historico")
    revalidatePath("/")

    return {
      success: true,
      message: `${allRows.length} treino(s) Hevy sincronizado(s).`,
    }
  } catch (error) {
    console.error("[syncHevyData]", error)
    const detail =
      error instanceof Error && error.message
        ? error.message
        : "Erro desconhecido."

    if (
      detail.includes("row-level security") ||
      detail.includes("SUPABASE_SERVICE_ROLE_KEY")
    ) {
      return { success: false, error: detail }
    }

    return {
      success: false,
      error: detail.startsWith("Não foi possível")
        ? detail
        : `Não foi possível sincronizar treinos do Hevy. ${detail}`,
    }
  }
}
