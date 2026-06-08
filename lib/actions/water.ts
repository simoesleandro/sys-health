"use server"

import { revalidatePath } from "next/cache"

import { createServerSupabase } from "@/lib/supabase/server"

export async function addWater(ml: number) {
  const volume = Math.round(ml)

  if (!Number.isFinite(volume) || volume <= 0) {
    return { success: false as const, error: "Informe um volume válido em ml." }
  }

  const supabase = createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  try {
    const { error } = await supabase.from("agua").insert({
      quantidade_ml: volume,
      data_hora: new Date().toISOString(),
    })

    if (error) throw error

    revalidatePath("/", "layout")
    revalidatePath("/registros")

    return { success: true as const, ml: volume }
  } catch (error) {
    console.error("[addWater]", error)
    return { success: false as const, error: "Não foi possível registrar a água." }
  }
}
