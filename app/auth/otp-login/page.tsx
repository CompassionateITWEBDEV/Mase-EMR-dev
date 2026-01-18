"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Syringe, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function OTPLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  const demoCredentials = [
    { role: "OTP Medical Director", username: "otp_director", password: "OTP2025!" },
    { role: "OTP Nurse", username: "otp_nurse", password: "NURSE2025!" },
    { role: "Counselor", username: "otp_counselor", password: "COUNSEL2025!" },
    { role: "Dosing Nurse", username: "dosing_nurse", password: "DOSE2025!" },
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simulate authentication
    setTimeout(() => {
      const validCredentials = demoCredentials.some((cred) => cred.username === username && cred.password === password)

      if (validCredentials) {
        localStorage.setItem("userRole", "otp_staff")
        localStorage.setItem("userName", username)
        router.push("/dashboard")
      } else {
        setError("Invalid credentials. Click 'Show Demo Credentials' to see valid logins.")
      }
      setLoading(false)
    }, 1000)
  }

  const fillDemoCredential = (username: string, password: string) => {
    setUsername(username)
    setPassword(password)
    setShowDemo(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center">
              <Syringe className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">OTP Clinic Portal</CardTitle>
          <CardDescription>Opioid Treatment Program - MAT Services</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600" disabled={loading}>
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
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <p className="text-sm font-medium mb-2">Demo Accounts:</p>
                  {demoCredentials.map((cred, index) => (
                    <div
                      key={index}
                      className="w-full text-left p-2 rounded hover:bg-background transition-colors text-sm"
                    >
                      <div className="font-medium" onClick={() => fillDemoCredential(cred.username, cred.password)}>
                        {cred.role}
                      </div>
                      <div className="text-muted-foreground">
                        {cred.username} / {cred.password}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/landing" className="text-rose-600 hover:underline">
              ← Back to Portal Selection
            </Link>
          </div>

          <div className="mt-4 p-3 bg-rose-50 rounded-lg">
            <p className="text-xs text-rose-800">
              <strong>42 CFR Part 2 Compliant:</strong> This system maintains strict confidentiality for substance use
              disorder treatment records.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
