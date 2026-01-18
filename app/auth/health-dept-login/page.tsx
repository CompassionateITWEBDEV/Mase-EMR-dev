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
import { Syringe } from "lucide-react"

export default function HealthDeptLoginPage() {
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
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Verify health department user credentials
      const { data: healthDeptUser, error: healthDeptError } = await supabase
        .from("health_dept_users")
        .select("*, health_departments(*)")
        .eq("email", formData.email)
        .eq("is_active", true)
        .single()

      if (healthDeptError || !healthDeptUser) {
        throw new Error("Invalid health department credentials or account is inactive")
      }

      // Simple password verification (in production, use proper hashing)
      if (formData.password !== "health-dept-demo-password") {
        throw new Error("Invalid password")
      }

      // Store session info
      sessionStorage.setItem("health_dept_user", JSON.stringify(healthDeptUser))

      router.push("/health-dept-portal/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
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
              <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                <Syringe className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold">Health Department Portal</CardTitle>
            <CardDescription>
              Secure access for city, county, and state health departments to immunization records and public health
              data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your health department email"
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
                {isLoading ? "Verifying Access..." : "Access Health Dept Portal"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    Public Health Access
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Secure Registry
                  </Badge>
                </div>
                All access to immunization records is secured and audit logged
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
