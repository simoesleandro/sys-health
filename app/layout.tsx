import type { Metadata, Viewport } from "next"
import { Exo_2, JetBrains_Mono } from "next/font/google"

import { TooltipProvider } from "@/components/ui/tooltip"

import "./globals.css"

const exo2 = Exo_2({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SYS.HEALTH",
  description:
    "Ecossistema pessoal de saúde e performance — nutrição, treino, sono e IA.",
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${exo2.variable} ${jetbrainsMono.variable} dark neon-site-bg h-full antialiased`}
    >
      <body className="neon-site-bg min-h-full flex flex-col font-sans">
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      </body>
    </html>
  )
}
