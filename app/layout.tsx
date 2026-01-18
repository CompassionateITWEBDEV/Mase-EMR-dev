import type React from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import { ReactQueryProvider } from "@/lib/react-query/provider";
import { AuthToggleProvider } from "@/lib/dev-tools/auth-toggle-context";
import { AuthTogglePanel } from "@/components/dev-tools/auth-toggle-panel";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MASE Behavioral Health EMR",
  description: "AI-Assisted Behavioral Health Documentation System",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      style={{ backgroundColor: "#ffffff" }}>
      <body
        className="font-sans antialiased"
        style={{
          backgroundColor: "#ffffff",
          color: "#0a0a0a",
          minHeight: "100vh",
          margin: 0,
          padding: 0,
        }}>
        <AuthToggleProvider>
          <ReactQueryProvider>
            <Suspense
              fallback={
                <div style={{ padding: "20px", color: "#0a0a0a" }}>
                  Loading...
                </div>
              }>
              {children}
            </Suspense>
          </ReactQueryProvider>
          <AuthTogglePanel />
          <Toaster />
          <Analytics />
        </AuthToggleProvider>
      </body>
    </html>
  );
}
