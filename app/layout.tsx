import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono, Amiri } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })
const _amiri = Amiri({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-arabic",
})

export const metadata: Metadata = {
  title: "Hadith Network Visualizer",
  description: "Explore hadith transmission networks through interactive graph visualization",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${_amiri.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
