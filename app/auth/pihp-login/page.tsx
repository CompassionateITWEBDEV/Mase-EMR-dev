"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Building } from "lucide-react"

export default function PIHPLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Attempting PIHP login for:", formData.email)

      // Call the proper authentication API with bcrypt password verification
      const response = await fetch("/api/auth/pihp/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Invalid credentials")
      }

      console.log("[v0] PIHP login successful for:", data.user.email)

      // Store session info (in production, use secure session management)
      sessionStorage.setItem("pihp_user", JSON.stringify(data.user))

      // Redirect to PIHP dashboard
      router.push("/pihp-portal/dashboard")
    } catch (error: unknown) {
      console.error("[v0] PIHP login failed:", error)
      setError(error instanceof Error ? error.message : "An error occurred during login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold">PIHP Portal Access</CardTitle>
            <CardDescription>
              Secure access for Prepaid Inpatient Health Plan organizations to view mental health and OTP service data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your PIHP email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                />
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying Access..." : "Access PIHP Portal"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    HIPAA Compliant
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Audit Logged
                  </Badge>
                </div>
                All PIHP access is monitored and logged for compliance
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Provider login?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Clinical Portal
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
