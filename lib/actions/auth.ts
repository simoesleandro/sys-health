"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createServerSupabase } from "@/lib/supabase/server"

export type AuthActionResult =
  | { success: true }
  | { success: false; error: string }

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthActionResult> {
  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false, error: "Supabase não configurado." }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  if (error) {
    return {
      success: false,
      error:
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
    }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<AuthActionResult> {
  const supabase = await createServerSupabase()
  if (!supabase) {
    return { success: false, error: "Supabase não configurado." }
  }

  if (password.length < 8) {
    return { success: false, error: "A senha deve ter pelo menos 8 caracteres." }
  }

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function signOut() {
  const supabase = await createServerSupabase()
  if (supabase) {
    await supabase.auth.signOut()
  }
  redirect("/login")
}
