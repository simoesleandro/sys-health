import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer"

import { formatSleepMinutes } from "@/lib/data"
import type { HealthReport } from "@/lib/report"

const COLORS = {
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  cyan: "#0e7490",
  panel: "#f8fafc",
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontSize: 10,
    color: COLORS.ink,
    fontFamily: "Helvetica",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.cyan,
    paddingBottom: 12,
    marginBottom: 18,
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 2,
    color: COLORS.cyan,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4 },
  subtitle: { fontSize: 10, color: COLORS.muted, marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: COLORS.cyan,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  rowLabel: { color: COLORS.muted },
  rowValue: { fontFamily: "Helvetica-Bold" },
  cards: { flexDirection: "row", gap: 10, marginBottom: 16 },
  card: {
    flex: 1,
    backgroundColor: COLORS.panel,
    borderRadius: 4,
    padding: 10,
  },
  cardLabel: { fontSize: 8, color: COLORS.muted, textTransform: "uppercase" },
  cardValue: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 4 },
  cardHint: { fontSize: 8, color: COLORS.muted, marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    fontSize: 8,
    color: COLORS.muted,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 6,
  },
})

const NA = "—"

function num(value: number, digits = 0) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export function HealthReportDocument({ report }: { report: HealthReport }) {
  const { nutrition, sleep, steps, recovery, weight, workouts, goals } = report

  const weightDelta =
    weight.deltaKg == null
      ? NA
      : `${weight.deltaKg > 0 ? "+" : ""}${num(weight.deltaKg, 1)} kg`

  return (
    <Document
      title={`SYS.HEALTH — Relatório ${report.periodDays} dias`}
      author="SYS.HEALTH"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.kicker}>SYS.HEALTH</Text>
          <Text style={styles.title}>Relatório de Saúde</Text>
          <Text style={styles.subtitle}>
            Período: {report.startLabel} a {report.endLabel} ({report.periodDays}{" "}
            dias) · Gerado em {report.generatedAtLabel}
          </Text>
        </View>

        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Peso</Text>
            <Text style={styles.cardValue}>
              {weight.end == null ? NA : `${num(weight.end, 1)} kg`}
            </Text>
            <Text style={styles.cardHint}>Variação {weightDelta}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Calorias/dia</Text>
            <Text style={styles.cardValue}>{num(nutrition.avgCalorias)}</Text>
            <Text style={styles.cardHint}>Meta {num(goals.TMB_KCAL)} kcal</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Sono/dia</Text>
            <Text style={styles.cardValue}>
              {sleep.avgSleepMin > 0
                ? formatSleepMinutes(Math.round(sleep.avgSleepMin))
                : NA}
            </Text>
            <Text style={styles.cardHint}>{sleep.daysWithData} dias c/ dado</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Treinos</Text>
            <Text style={styles.cardValue}>
              {workouts.hevyCount + workouts.zeppCount}
            </Text>
            <Text style={styles.cardHint}>
              Hevy {workouts.hevyCount} · Zepp {workouts.zeppCount}
            </Text>
          </View>
        </View>

        <Section title="Peso">
          <StatRow
            label="Início do período"
            value={weight.start == null ? NA : `${num(weight.start, 1)} kg`}
          />
          <StatRow
            label="Fim do período"
            value={weight.end == null ? NA : `${num(weight.end, 1)} kg`}
          />
          <StatRow label="Variação" value={weightDelta} />
          <StatRow label="Medições no período" value={num(weight.samples)} />
        </Section>

        <Section title="Nutrição (média por dia registado)">
          <StatRow
            label="Calorias"
            value={`${num(nutrition.avgCalorias)} / ${num(goals.TMB_KCAL)} kcal`}
          />
          <StatRow
            label="Proteína"
            value={`${num(nutrition.avgProteinas)} / ${num(goals.PROTEIN_G)} g`}
          />
          <StatRow
            label="Carboidratos"
            value={`${num(nutrition.avgCarboidratos)} / ${num(goals.CARBS_G)} g`}
          />
          <StatRow
            label="Gorduras"
            value={`${num(nutrition.avgGorduras)} / ${num(goals.FATS_G)} g`}
          />
          <StatRow
            label="Água"
            value={`${num(nutrition.avgAguaLitros, 1)} / ${num(goals.WATER_L, 1)} L`}
          />
          <StatRow
            label="Dias com registo"
            value={`${nutrition.daysWithData} de ${report.periodDays}`}
          />
        </Section>

        <Section title="Sono, passos e recuperação">
          <StatRow
            label="Sono médio"
            value={
              sleep.avgSleepMin > 0
                ? formatSleepMinutes(Math.round(sleep.avgSleepMin))
                : NA
            }
          />
          <StatRow
            label="Passos (média/dia)"
            value={steps.avgSteps > 0 ? num(steps.avgSteps) : NA}
          />
          <StatRow
            label="Passos (total)"
            value={steps.totalSteps > 0 ? num(steps.totalSteps) : NA}
          />
          <StatRow
            label="HRV médio"
            value={recovery.avgHrvMs > 0 ? `${num(recovery.avgHrvMs)} ms` : NA}
          />
          <StatRow
            label="PAI médio"
            value={recovery.avgPai > 0 ? num(recovery.avgPai) : NA}
          />
        </Section>

        <Section title="Treinos">
          <StatRow label="Sessões Hevy (musculação)" value={num(workouts.hevyCount)} />
          <StatRow
            label="Volume total Hevy"
            value={
              workouts.hevyVolumeKg > 0
                ? `${num(Math.round(workouts.hevyVolumeKg))} kg`
                : NA
            }
          />
          <StatRow label="Sessões Zepp (cardio)" value={num(workouts.zeppCount)} />
          <StatRow
            label="Distância total Zepp"
            value={
              workouts.zeppDistanceKm > 0
                ? `${num(workouts.zeppDistanceKm, 1)} km`
                : NA
            }
          />
        </Section>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `SYS.HEALTH · Relatório gerado automaticamente · ${pageNumber}/${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}

/** Renderiza o relatório em PDF (usado pela rota /api/report/pdf). */
export async function renderHealthReportPdf(report: HealthReport) {
  return renderToBuffer(<HealthReportDocument report={report} />)
}
