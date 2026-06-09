"use server"

import { revalidatePath } from "next/cache"

import { getBrtTodayUtcBounds } from "@/lib/data"
import {
  fetchHevyWorkoutsPage,
  mapHevyWorkoutToRow,
} from "@/lib/hevy-api"
import { getHevyApiKey, getZeppAppToken, getZeppUserId } from "@/lib/sync-env"
import { createServerSupabase } from "@/lib/supabase/server"
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

async function fetchExistingZeppRow(dayString: string) {
  const supabase = await createServerSupabase()
  if (!supabase) return {}

  const { data } = await supabase
    .from("amazfit_dados")
    .select("hrv_ms, pai, sono_total_min, sono_profundo_min")
    .eq("data_hora", `${dayString} 00:00:00`)
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

async function saveZeppRow(row: ZeppAmazfitRow) {
  const supabase = await createServerSupabase()
  if (!supabase) {
    throw new Error("Supabase não configurado.")
  }

  const { error: deleteError } = await supabase
    .from("amazfit_dados")
    .delete()
    .eq("data_hora", row.data_hora)

  if (deleteError) throw deleteError

  const { error: insertError } = await supabase
    .from("amazfit_dados")
    .insert(row)

  if (insertError) throw insertError
}

export async function syncZeppData(
  dayString?: string
): Promise<SyncActionResult> {
  const day = dayString ?? getBrtTodayUtcBounds().brtDate
  const appToken = getZeppAppToken()
  const userId = getZeppUserId()

  if (!appToken) {
    return { success: false, error: "ZEPP_APP_TOKEN não configurado." }
  }

  if (!userId) {
    return { success: false, error: "ZEPP_USER_ID não configurado." }
  }

  try {
    console.log("[syncZeppData] iniciando fetch Zepp:", { day, userId })

    const [summary, hrvPaiFromApi, existing] = await Promise.all([
      fetchZeppBandSummary(day, appToken, userId),
      fetchZeppHrvPaiForDay(day, appToken, userId),
      fetchExistingZeppRow(day),
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

    await saveZeppRow(row)

    console.log("[syncZeppData] resumo salvo — iniciando sync de treinos detalhados")
    const workoutsResult = await syncZeppWorkouts(90, {
      allowEmpty: true,
      skipRevalidate: true,
    })

    revalidatePath("/", "layout")
    revalidatePath("/evolucao")
    revalidatePath("/treinos")
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
    return {
      success: false,
      error: "Não foi possível sincronizar dados do Zepp/Amazfit.",
    }
  }
}

async function upsertZeppWorkouts(rows: ZeppWorkoutRow[]) {
  const supabase = await createServerSupabase()
  if (!supabase) {
    throw new Error("Supabase não configurado.")
  }

  const { error } = await supabase
    .from("amazfit_workouts")
    .upsert(
      rows.map((row) => ({
        ...row,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "track_id" }
    )

  if (error) throw error
}

export async function syncZeppWorkouts(
  daysBack = 90,
  options: SyncZeppWorkoutsOptions = {}
): Promise<SyncActionResult> {
  const { allowEmpty = false, skipRevalidate = false } = options
  const appToken = getZeppAppToken()
  const userId = getZeppUserId()

  if (!appToken) {
    return { success: false, error: "ZEPP_APP_TOKEN não configurado." }
  }

  if (!userId) {
    return { success: false, error: "ZEPP_USER_ID não configurado." }
  }

  try {
    const stopTrackId = Math.floor(Date.now() / 1000)
    const startTrackId = stopTrackId - daysBack * 24 * 60 * 60

    console.log("[syncZeppWorkouts] fetch Zepp history:", {
      userId,
      startTrackId,
      stopTrackId,
      daysBack,
    })

    const summary = await fetchZeppWorkoutHistory(
      appToken,
      userId,
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

    await upsertZeppWorkouts(rows)

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
    return {
      success: false,
      error: "Não foi possível sincronizar treinos detalhados do Zepp.",
    }
  }
}

async function upsertHevyWorkouts(
  rows: ReturnType<typeof mapHevyWorkoutToRow>[]
) {
  const supabase = await createServerSupabase()
  if (!supabase) {
    throw new Error("Supabase não configurado.")
  }

  const { error } = await supabase.from("hevy_treinos").upsert(rows, {
    onConflict: "id",
  })

  if (error) throw error
}

export async function syncHevyData(
  maxPages = 5
): Promise<SyncActionResult> {
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
        50
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

    await upsertHevyWorkouts(allRows)

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
    return {
      success: false,
      error: "Não foi possível sincronizar treinos do Hevy.",
    }
  }
}
