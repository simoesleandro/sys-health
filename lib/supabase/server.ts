import { createClient, type SupabaseClient } from "@supabase/supabase-js"

function isValidSupabaseUrl(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false
    }

    // Reject placeholders from .env.example
    if (
      parsed.hostname.includes("your-project") ||
      parsed.hostname === "localhost" && !url.includes("54321")
    ) {
      return false
    }

    return parsed.hostname.length > 0
  } catch {
    return false
  }
}

export function createServerSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim()

  if (!url || !key || !isValidSupabaseUrl(url)) {
    if (process.env.NODE_ENV === "production" && url && !isValidSupabaseUrl(url)) {
      console.error(
        "[createServerSupabase] NEXT_PUBLIC_SUPABASE_URL inválida:",
        url
      )
    }
    return null
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
