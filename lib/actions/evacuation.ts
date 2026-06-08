"use server"

import { revalidatePath } from "next/cache"

import type { BristolType } from "@/lib/evacuation"
import { createServerSupabase } from "@/lib/supabase/server"

function isValidBristolType(tipo: number): tipo is BristolType {
  return Number.isInteger(tipo) && tipo >= 1 && tipo <= 7
}

export async function registerEvacuation(
  tipo: number,
  observacoes?: string | null
) {
  if (!isValidBristolType(tipo)) {
    return { success: false as const, error: "Tipo Bristol inválido (1 a 7)." }
  }

  const supabase = createServerSupabase()
  if (!supabase) {
    return { success: false as const, error: "Supabase não configurado." }
  }

  const observacao = observacoes?.trim() || null

  try {
    // A tabela `evacuacoes` guarda o tipo Bristol na coluna `esforco`.
    const { error } = await supabase.from("evacuacoes").insert({
      data_hora: new Date().toISOString(),
      esforco: tipo,
      observacao,
    })

    if (error) throw error

    revalidatePath("/evacuacao")

    return { success: true as const }
  } catch (error) {
    console.error("[registerEvacuation]", error)
    return {
      success: false as const,
      error: "Não foi possível registar a evacuação.",
    }
  }
}
