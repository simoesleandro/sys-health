import { createServerClient } from "@supabase/ssr"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

function isValidSupabaseUrl(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false
    }

    if (
      parsed.hostname.includes("your-project") ||
      (parsed.hostname === "localhost" && !url.includes("54321"))
    ) {
      return false
    }

    return parsed.hostname.length > 0
  } catch {
    return false
  }
}

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
}

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
}

/** Cliente com sessão do utilizador (cookies) — usar em Server Components e actions. */
export async function createServerSupabase(): Promise<SupabaseClient | null> {
  const url = getSupabaseUrl()
  const key = getAnonKey()

  if (!url || !key || !isValidSupabaseUrl(url)) {
    if (process.env.NODE_ENV === "production" && url && !isValidSupabaseUrl(url)) {
      console.error(
        "[createServerSupabase] NEXT_PUBLIC_SUPABASE_URL inválida:",
        url
      )
    }
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Components não podem escrever cookies; o middleware renova a sessão.
        }
      },
    },
  })
}

/** Service role — apenas jobs admin/sync que precisam ignorar RLS. */
export function createServiceSupabase(): SupabaseClient | null {
  const url = getSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !key || !isValidSupabaseUrl(url)) {
    return null
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export type ServerSupabaseClient = NonNullable<
  Awaited<ReturnType<typeof createServerSupabase>>
>
