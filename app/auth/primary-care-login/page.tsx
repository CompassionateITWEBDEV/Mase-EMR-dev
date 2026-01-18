"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, HeartPulse, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PrimaryCareLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const demoCredentials = [
    { username: "dr_primary", password: "PRIMARY2025!", role: "Family Medicine Physician" },
    { username: "dr_internal", password: "INTERNAL2025!", role: "Internal Medicine Physician" },
    { username: "np_primary", password: "NP2025!", role: "Nurse Practitioner" },
  ]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Demo login validation
    const validCredential = demoCredentials.find((cred) => cred.username === username && cred.password === password)

    setTimeout(() => {
      if (validCredential) {
        // Enable auth bypass in development mode
        if (process.env.NODE_ENV === "development") {
          document.cookie = `dev_bypass_auth=true; path=/; max-age=86400; SameSite=Lax`;
        }
        
        toast({
          title: "Login Successful",
          description: `Welcome ${validCredential.role}!`,
        })
        router.push("/primary-care-dashboard")
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password",
          variant: "destructive",
        })
      }
      setIsLoading(false)
    }, 1000)
  }

  const fillDemoCredentials = (cred: (typeof demoCredentials)[0]) => {
    setUsername(cred.username)
    setPassword(cred.password)
    setShowDemo(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-background to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 justify-center">
            <div className="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center">
              <HeartPulse className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Primary Care Portal</CardTitle>
          <CardDescription className="text-center">Family Medicine & Internal Medicine Provider Access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
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
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center">
            <Button variant="link" className="text-sm text-indigo-600" onClick={() => setShowDemo(!showDemo)}>
              {showDemo ? "Hide Demo Credentials" : "Show Demo Credentials"}
            </Button>
          </div>

          {showDemo && (
            <Alert className="bg-indigo-50 border-indigo-200">
              <AlertCircle className="h-4 w-4 text-indigo-600" />
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  {demoCredentials.map((cred, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2 bg-transparent"
                      onClick={() => fillDemoCredentials(cred)}
                    >
                      <div className="text-sm">
                        <div className="font-semibold">{cred.role}</div>
                        <div className="text-muted-foreground">
                          {cred.username} / {cred.password}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <a href="/landing" className="hover:underline">
              ← Back to Portal Selection
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
