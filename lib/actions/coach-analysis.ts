"use server"

import { revalidatePath } from "next/cache"

import { requireAuth } from "@/lib/supabase/auth"

export async function logCoachAnalysis(input: {
  pergunta: string
  resposta: string
}) {
  const pergunta = input.pergunta.trim()
  const resposta = input.resposta.trim()

  if (!pergunta || !resposta) {
    return {
      success: false as const,
      error: "Pergunta e resposta são obrigatórias.",
    }
  }

  const auth = await requireAuth()
  if (auth.error || !auth.supabase) {
    return {
      success: false as const,
      error: auth.error ?? "Supabase não configurado.",
    }
  }

  try {
    const { error } = await auth.supabase.from("ia_analises_coach").insert({
      pergunta,
      resposta,
    })

    if (error) {
      console.warn("[logCoachAnalysis] insert failed:", error.message)
      return { success: true as const, skipped: true as const }
    }

    revalidatePath("/historico")
    revalidatePath("/ia-coach")

    return { success: true as const, skipped: false as const }
  } catch (error) {
    console.error("[logCoachAnalysis]", error)
    return { success: true as const, skipped: true as const }
  }
}
