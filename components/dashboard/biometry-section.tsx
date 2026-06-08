import { BiometrySectionCard } from "@/components/dashboard/biometry-section-card"
import { getLatestMeasurement } from "@/lib/data"

export async function BiometrySection({
  showHeader = true,
}: {
  showHeader?: boolean
}) {
  const latest = await getLatestMeasurement()

  return <BiometrySectionCard latest={latest} showHeader={showHeader} />
}
