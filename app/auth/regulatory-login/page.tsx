"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Shield, Building, FileCheck } from "lucide-react"

export default function RegulatoryLoginPage() {
  const [formData, setFormData] = useState({
    inspectorId: "",
    password: "",
    organization: "",
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
      // First verify the inspector credentials
      const { data: accessData, error: accessError } = await supabase
        .from("regulatory_access")
        .select("*")
        .eq("inspector_id", formData.inspectorId)
        .eq("organization", formData.organization)
        .eq("is_active", true)
        .gt("access_expires_at", new Date().toISOString())
        .single()

      if (accessError || !accessData) {
        throw new Error("Invalid inspector credentials or access has expired")
      }

      // Find the provider account for this inspector
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("*")
        .eq("inspector_id", formData.inspectorId)
        .single()

      if (providerError || !providerData) {
        throw new Error("Inspector account not found")
      }

      // Authenticate with Supabase
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: providerData.email,
        password: formData.password,
      })

      if (authError) throw authError

      // Log the regulatory access
      await supabase.from("regulatory_audit_log").insert({
        user_id: providerData.id,
        inspector_id: formData.inspectorId,
        action: "login",
        resource_type: "system",
      })

      // Redirect based on organization
      if (formData.organization === "DEA") {
        router.push("/regulatory/dea")
      } else if (formData.organization === "Joint Commission") {
        router.push("/regulatory/joint-commission")
      } else {
        router.push("/regulatory/dashboard")
      }
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
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold">Regulatory Portal Access</CardTitle>
            <CardDescription>Secure login for regulatory inspectors and surveyors</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Select onValueChange={(value) => handleInputChange("organization", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your organization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEA">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>Drug Enforcement Administration (DEA)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Joint Commission">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="h-4 w-4" />
                        <span>The Joint Commission</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="State Board">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>State Regulatory Board</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspectorId">Inspector ID</Label>
                <Input
                  id="inspectorId"
                  placeholder="Enter your inspector ID"
                  required
                  value={formData.inspectorId}
                  onChange={(e) => handleInputChange("inspectorId", e.target.value)}
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
                {isLoading ? "Verifying Access..." : "Access Portal"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    Secure Access
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Audit Logged
                  </Badge>
                </div>
                All regulatory access is monitored and logged for compliance purposes
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
