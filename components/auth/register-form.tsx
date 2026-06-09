"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signUpWithPassword } from "@/lib/actions/auth"

export function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.")
      return
    }

    startTransition(async () => {
      const result = await signUpWithPassword(email, password)
      if (!result.success) {
        setError(result.error)
        return
      }

      setInfo(
        "Conta criada. Se a confirmação por e-mail estiver ativa no Supabase, verifique sua caixa de entrada antes de entrar."
      )
      router.replace("/")
      router.refresh()
    })
  }

  return (
    <AuthCard
      title="Criar conta"
      subtitle="Seus registros ficam isolados por usuário (RLS)."
      footer={
        <p className="text-slate-400">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-brand-cyan hover:underline">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-300">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="border-zinc-800/70 bg-black/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-300">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border-zinc-800/70 bg-black/40"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-300"
          >
            Confirmar senha
          </label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="border-zinc-800/70 bg-black/40"
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-2 text-sm text-brand-cyan">
            {info}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand-cyan font-semibold text-black hover:bg-brand-cyan/90"
        >
          {isPending ? "Criando…" : "Criar conta"}
        </Button>
      </form>
    </AuthCard>
  )
}
