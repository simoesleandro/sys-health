"use client"

import { LogOut } from "lucide-react"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"

export function SignOutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending}
      className={className}
      onClick={() => startTransition(() => signOut())}
    >
      <LogOut className="size-3.5" />
      {isPending ? "Saindo…" : "Sair"}
    </Button>
  )
}
