"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signInWithPassword } from "@/lib/actions/auth"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get("next") ?? "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await signInWithPassword(email, password)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.replace(nextPath)
      router.refresh()
    })
  }

  return (
    <AuthCard
      title="Entrar"
      subtitle="Acesse seus dados de saúde com segurança."
      footer={
        <p className="text-slate-400">
          Ainda não tem conta?{" "}
          <Link href="/registro" className="font-medium text-brand-cyan hover:underline">
            Criar conta
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="border-zinc-800/70 bg-black/40"
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand-cyan font-semibold text-black hover:bg-brand-cyan/90"
        >
          {isPending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
    </AuthCard>
  )
}
