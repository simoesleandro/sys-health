import type { User } from "@supabase/supabase-js"

import { createServerSupabase } from "@/lib/supabase/server"

type AuthResult =
  | {
      supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>
      user: User
      error: null
    }
  | {
      supabase: Awaited<ReturnType<typeof createServerSupabase>>
      user: null
      error: string
    }

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createServerSupabase()
  if (!supabase) {
    return { supabase: null, user: null, error: "Supabase não configurado." }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      supabase,
      user: null,
      error: "Sessão inválida. Faça login novamente.",
    }
  }

  return { supabase, user, error: null }
}

export async function getOptionalUser() {
  const supabase = await createServerSupabase()
  if (!supabase) return { supabase: null, user: null }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}
