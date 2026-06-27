import type { NextConfig } from "next"
import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {
  // @react-pdf/renderer não deve ser empacotado pelo webpack (render server-side).
  serverExternalPackages: ["@react-pdf/renderer"],
}

export default withPWA(nextConfig)
