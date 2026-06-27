import { renderHealthReportPdf } from "@/lib/pdf/health-report-document"
import { getHealthReport, resolveReportPeriod } from "@/lib/report"
import { requireAuth } from "@/lib/supabase/auth"

// @react-pdf/renderer precisa do runtime Node e não pode ser prerenderizado.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"
export const maxDuration = 60

export async function GET(request: Request) {
  const auth = await requireAuth()
  if (!auth.user) {
    return new Response(auth.error, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const periodDays = resolveReportPeriod(searchParams.get("days"))

  try {
    const report = await getHealthReport(periodDays)
    const buffer = await renderHealthReportPdf(report)
    const filename = `sys-health-relatorio-${report.endDate}-${periodDays}d.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[GET /api/report/pdf]", error)
    return new Response("Não foi possível gerar o relatório PDF.", {
      status: 500,
    })
  }
}
