"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Dumbbell, Eye, EyeOff, ArrowLeft, Activity, ClipboardList, Users, Calendar } from "lucide-react"
import Link from "next/link"

// Sample credentials for demo
const DEMO_CREDENTIALS = [
  {
    username: "pt_therapist",
    password: "PT2025!",
    name: "Dr. Sarah Mitchell",
    role: "Physical Therapist",
    license: "PT-12345",
  },
  {
    username: "ot_therapist",
    password: "OT2025!",
    name: "Dr. Michael Chen",
    role: "Occupational Therapist",
    license: "OT-67890",
  },
  {
    username: "speech_therapist",
    password: "SLP2025!",
    name: "Dr. Emily Rodriguez",
    role: "Speech-Language Pathologist",
    license: "SLP-11111",
  },
]

export default function PTOTLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate authentication
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const user = DEMO_CREDENTIALS.find((cred) => cred.username === username && cred.password === password)

    if (user) {
      // Store user info in localStorage for the session
      localStorage.setItem("pt_ot_user", JSON.stringify(user))
      localStorage.setItem("pt_ot_authenticated", "true")

      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
      })

      router.push("/pt-ot-dashboard")
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password. Try the demo credentials below.",
        variant: "destructive",
      })
    }

    setLoading(false)
  }

  const fillCredentials = (cred: (typeof DEMO_CREDENTIALS)[0]) => {
    setUsername(cred.username)
    setPassword(cred.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/landing" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Portal Selection
        </Link>

        <Card className="border-2 border-amber-200 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mb-4">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-amber-700">Physical Therapy & OT Portal</CardTitle>
            <CardDescription>Secure access for rehabilitation professionals</CardDescription>
          </CardHeader>

          <CardContent>
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
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Demo Credentials Section */}
            <div className="mt-6 pt-6 border-t">
              <Button
                variant="outline"
                className="w-full mb-3 bg-transparent"
                onClick={() => setShowCredentials(!showCredentials)}
              >
                {showCredentials ? "Hide" : "Show"} Demo Credentials
              </Button>

              {showCredentials && (
                <div className="space-y-2 text-sm">
                  {DEMO_CREDENTIALS.map((cred, index) => (
                    <div
                      key={index}
                      className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => fillCredentials(cred)}
                    >
                      <div className="font-medium text-amber-700">{cred.role}</div>
                      <div className="text-muted-foreground">
                        <span className="font-mono">Username: {cred.username}</span>
                        <br />
                        <span className="font-mono">Password: {cred.password}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cred.name} • License: {cred.license}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-center text-muted-foreground mt-2">Click any credential to auto-fill</p>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-4 pt-0">
            <div className="grid grid-cols-2 gap-3 w-full text-center text-xs">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Activity className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                <span className="text-muted-foreground">RTM Billing</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <ClipboardList className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                <span className="text-muted-foreground">HEP Programs</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Users className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                <span className="text-muted-foreground">Patient Tracking</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <Calendar className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                <span className="text-muted-foreground">Scheduling</span>
              </div>
            </div>
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          HIPAA Compliant • Secure Connection • SOC 2 Type II
        </p>
      </div>
    </div>
  )
}
