"use client"

import * as React from "react"
import { Download, FileText, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_REPORT_PERIOD,
  REPORT_PERIOD_OPTIONS,
  type ReportPeriodDays,
} from "@/lib/report"
import { cn } from "@/lib/utils"

export function ExportPdfButton({ className }: { className?: string }) {
  const [days, setDays] = React.useState<ReportPeriodDays>(
    DEFAULT_REPORT_PERIOD
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleExport() {
    if (isLoading) return
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/report/pdf?days=${days}`)
      if (!response.ok) {
        throw new Error(await response.text().catch(() => ""))
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `sys-health-relatorio-${days}d.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      setError("Falha ao gerar o PDF. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <div className="flex items-center gap-2">
        <Select
          value={String(days)}
          onValueChange={(value) => setDays(Number(value) as ReportPeriodDays)}
        >
          <SelectTrigger size="sm" className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} dias
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleExport} disabled={isLoading} size="sm">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          <FileText className="size-4" />
          Exportar PDF
        </Button>
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
