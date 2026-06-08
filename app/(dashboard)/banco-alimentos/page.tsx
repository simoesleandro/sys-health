import { FoodBankManager } from "@/components/foods/food-bank-manager"
import { PageShell } from "@/components/layout/page-shell"
import { getFavoriteFoods } from "@/lib/data"

export default async function BancoAlimentosPage() {
  const foods = await getFavoriteFoods()

  return (
    <PageShell>
      <FoodBankManager foods={foods} />
    </PageShell>
  )
}
