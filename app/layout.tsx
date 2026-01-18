import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "MASE Behavioral Health EMR",
  description: "AI-Assisted Behavioral Health Documentation System",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} style={{ backgroundColor: "#ffffff" }}>
      <body
        className="font-sans antialiased"
        style={{
          backgroundColor: "#ffffff",
          color: "#0a0a0a",
          minHeight: "100vh",
          margin: 0,
          padding: 0,
        }}
      >
        <Suspense fallback={<div style={{ padding: "20px", color: "#0a0a0a" }}>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
