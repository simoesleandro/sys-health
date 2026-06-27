import { syncHevyDataForUser } from "@/lib/actions/sync"

// Lê headers/env por request — nunca deve ser prerenderizado/cacheado.
export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Cron diário (Vercel) que sincroniza os treinos Hevy do dono dos dados.
 * - Protegido por `CRON_SECRET` (a Vercel envia `Authorization: Bearer <secret>`).
 * - O user_id alvo vem de `CRON_SYNC_USER_ID` (a chave Hevy é global/single-tenant).
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim()
  if (cronSecret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 })
    }
  }

  const userId = process.env.CRON_SYNC_USER_ID?.trim()
  if (!userId) {
    return Response.json(
      { success: false, error: "CRON_SYNC_USER_ID não configurado." },
      { status: 500 }
    )
  }

  const result = await syncHevyDataForUser(userId)
  console.log("[cron/hevy]", result)

  return Response.json(result, { status: result.success ? 200 : 500 })
}
