import { createBrowserClient } from "@supabase/ssr"

export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !key) {
    throw new Error("Supabase não configurado (URL ou anon key ausente).")
  }

  return createBrowserClient(url, key)
}
