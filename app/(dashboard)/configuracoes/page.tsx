import { SettingsManager } from "@/components/settings/settings-manager"
import { PageShell } from "@/components/layout/page-shell"
import {
  getUserNutritionGoals,
  getUserSupplementConfigs,
} from "@/lib/user-settings"

export default async function ConfiguracoesPage() {
  const [goals, supplements] = await Promise.all([
    getUserNutritionGoals(),
    getUserSupplementConfigs(),
  ])

  return (
    <PageShell>
      <SettingsManager initialGoals={goals} initialSupplements={supplements} />
    </PageShell>
  )
}
