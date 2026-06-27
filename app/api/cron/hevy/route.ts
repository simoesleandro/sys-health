import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { syncHevyDataForUser } from "@/lib/hevy-sync"

// Lê headers/env por request — nunca deve ser prerenderizado/cacheado.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

/**
 * Cron diário (Vercel) que sincroniza os treinos Hevy do dono dos dados.
 * - Protegido por `CRON_SECRET` (a Vercel envia `Authorization: Bearer <secret>`).
 * - O user_id alvo vem de `CRON_SYNC_USER_ID` (a chave Hevy é global/single-tenant).
 * - O client Supabase é criado direto via service role (sem `next/headers`,
 *   que quebraria o build do route handler).
 */
export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET?.trim()
    if (cronSecret) {
      const authHeader = request.headers.get("authorization")
      if (authHeader !== `Bearer ${cronSecret}`) {
        return new Response("Unauthorized", { status: 401 })
      }
    }

    const userId = process.env.CRON_SYNC_USER_ID?.trim()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

    console.log("[cron/hevy] env check", {
      hasCronSecret: Boolean(cronSecret),
      hasUserId: Boolean(userId),
      hasUrl: Boolean(supabaseUrl),
      hasServiceRole: Boolean(serviceKey),
      hasHevyKey: Boolean(process.env.HEVY_API_KEY?.trim()),
    })

    if (!userId) {
      return Response.json(
        { success: false, error: "CRON_SYNC_USER_ID não configurado." },
        { status: 500 }
      )
    }

    if (!supabaseUrl || !serviceKey) {
      return Response.json(
        {
          success: false,
          error:
            "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para o sync automático.",
        },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const result = await syncHevyDataForUser(userId, supabase)
    console.log("[cron/hevy] result", result)

    if (result.success) {
      revalidatePath("/", "layout")
      revalidatePath("/treinos")
      revalidatePath("/historico")
      revalidatePath("/")
    }

    return Response.json(result, { status: result.success ? 200 : 500 })
  } catch (error) {
    console.error("[cron/hevy] erro não tratado:", error)
    if (error instanceof Error) {
      console.error("[cron/hevy] message:", error.message)
      console.error("[cron/hevy] stack:", error.stack)
    }

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erro desconhecido no cron.",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
