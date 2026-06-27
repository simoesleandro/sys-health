/**
 * Configuração do relatório PDF — sem dependências de servidor, para poder
 * ser importado tanto pelo data layer (`lib/report.ts`) quanto por client
 * components (`export-pdf-button.tsx`) sem puxar `next/headers`.
 */

/** Períodos oferecidos no botão "Exportar PDF". */
export const REPORT_PERIOD_OPTIONS = [7, 14, 30] as const
export type ReportPeriodDays = (typeof REPORT_PERIOD_OPTIONS)[number]
export const DEFAULT_REPORT_PERIOD: ReportPeriodDays = 14

export function resolveReportPeriod(
  value: number | string | null | undefined
): ReportPeriodDays {
  const parsed = typeof value === "string" ? Number(value) : value
  return (REPORT_PERIOD_OPTIONS as readonly number[]).includes(parsed as number)
    ? (parsed as ReportPeriodDays)
    : DEFAULT_REPORT_PERIOD
}
