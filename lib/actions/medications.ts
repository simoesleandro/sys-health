"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import { getBrtTodayUtcBounds } from "@/lib/data"
import { createServerSupabase } from "@/lib/supabase/server"

const MOCK_LOGS_COOKIE = "syshealth-medication-logs"

type MockLogCookie = {
  date: string
  takenIds: number[]
}

async function readMockTakenIds(brtDate: string) {
  const cookieStore = await cookies()
  const raw = cookieStore.get(MOCK_LOGS_COOKIE)?.value
  if (!raw) return new Set<number>()

  try {
    const parsed = JSON.parse(raw) as MockLogCookie
    if (parsed.date !== brtDate) return new Set<number>()
    return new Set(parsed.takenIds)
  } catch {
    return new Set<number>()
  }
}

async function writeMockTakenIds(brtDate: string, takenIds: number[]) {
  const cookieStore = await cookies()
  const payload: MockLogCookie = { date: brtDate, takenIds }
  cookieStore.set(MOCK_LOGS_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  })
}

async function toggleMedicationInDatabase(
  medicationId: number,
  isTaken: boolean,
  brtDate: string
) {
  const supabase = await createServerSupabase()
  if (!supabase) return { ok: false as const, useMock: true }

  try {
    if (isTaken) {
      const { error } = await supabase.from("logs_medicacao").insert({
        medicamento_id: medicationId,
        data: brtDate,
        data_hora: new Date().toISOString(),
      })

      if (error) throw error
    } else {
      const { error } = await supabase
        .from("logs_medicacao")
        .delete()
        .eq("medicamento_id", medicationId)
        .eq("data", brtDate)

      if (error) throw error
    }

    return { ok: true as const, useMock: false }
  } catch (error) {
    console.error("[toggleMedicationInDatabase]", error)
    return { ok: false as const, useMock: true }
  }
}

export async function toggleMedication(
  medicationId: number,
  isTaken: boolean
) {
  if (!Number.isFinite(medicationId) || medicationId <= 0) {
    return { success: false as const, error: "Medicamento inválido." }
  }

  const { brtDate } = getBrtTodayUtcBounds()
  const dbResult = await toggleMedicationInDatabase(
    medicationId,
    isTaken,
    brtDate
  )

  if (!dbResult.ok) {
    const takenIds = await readMockTakenIds(brtDate)

    if (isTaken) {
      takenIds.add(medicationId)
    } else {
      takenIds.delete(medicationId)
    }

    await writeMockTakenIds(brtDate, Array.from(takenIds))
  }

  revalidatePath("/medicacao")

  return { success: true as const, isTaken }
}
