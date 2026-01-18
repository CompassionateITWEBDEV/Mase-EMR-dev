"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stethoscope, Eye, EyeOff, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function ProviderLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })

  const demoCredentials = [
    { label: "MD - Psychiatrist", username: "dr_psychiatrist", password: "PSYCH2025!", specialty: "Psychiatry" },
    { label: "MD - OB/GYN", username: "dr_obgyn", password: "OBGYN2025!", specialty: "Obstetrics" },
    { label: "NP - Psych", username: "np_psych", password: "NPPSYCH2025!", specialty: "Psychiatry NP" },
    { label: "PA - Primary Care", username: "pa_primary", password: "PA2025!", specialty: "Primary Care PA" },
  ]

  const fillDemo = (username: string, password: string) => {
    setFormData({ username, password })
    setShowDemo(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate authentication
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check demo credentials
      const validCredential = demoCredentials.find(
        (cred) => cred.username === formData.username && cred.password === formData.password,
      )

      if (validCredential) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${validCredential.specialty}!`,
        })

        // Store session
        localStorage.setItem("userType", "provider")
        localStorage.setItem("userName", validCredential.specialty)

        router.push("/dashboard")
      } else {
        toast({
          title: "Invalid Credentials",
          description: "Please check your username and password.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Link
            href="/landing"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portal Selection
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Provider Portal</CardTitle>
              <CardDescription>Healthcare providers - Clinical access</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setShowDemo(!showDemo)}
            >
              {showDemo ? "Hide Demo Credentials" : "Show Demo Credentials"}
            </Button>

            {showDemo && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium mb-2">Demo Credentials:</p>
                {demoCredentials.map((cred, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-background rounded cursor-pointer hover:bg-accent"
                    onClick={() => fillDemo(cred.username, cred.password)}
                  >
                    <div className="text-sm">
                      <div className="font-medium">{cred.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {cred.username} / {cred.password}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <Link href="/auth/forgot-password" className="hover:text-primary">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
