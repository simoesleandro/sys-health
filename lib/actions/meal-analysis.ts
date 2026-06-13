"use server"

import { revalidatePath } from "next/cache"

import type { MealAnalysisItem } from "@/lib/meal-analysis"
import { requireAuth } from "@/lib/supabase/auth"

export async function logMealAnalysis(input: {
  tipo: "texto" | "foto"
  entradaTexto?: string | null
  imagemNome?: string | null
  respostaBruta: unknown
  itens: MealAnalysisItem[]
  refeicaoId?: number | null
}) {
  const auth = await requireAuth()
  if (auth.error || !auth.supabase) {
    return {
      success: false as const,
      error: auth.error ?? "Supabase não configurado.",
    }
  }

  try {
    const { error } = await auth.supabase.from("ia_analises_refeicao").insert({
      tipo: input.tipo,
      entrada_texto: input.entradaTexto?.trim() || null,
      imagem_nome: input.imagemNome?.trim() || null,
      resposta_bruta_json: input.respostaBruta,
      itens_parseados_json: input.itens,
      status: "aprovado",
      refeicao_id: input.refeicaoId ?? null,
    })

    if (error) {
      console.warn("[logMealAnalysis] table missing or insert failed:", error.message)
      return { success: true as const, skipped: true as const }
    }

    revalidatePath("/historico")

    return { success: true as const, skipped: false as const }
  } catch (error) {
    console.error("[logMealAnalysis]", error)
    return { success: true as const, skipped: true as const }
  }
}
