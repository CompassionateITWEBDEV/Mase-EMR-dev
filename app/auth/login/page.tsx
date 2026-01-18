"use client"

import type React from "react"
import { Shield } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for error from callback route
    const errorParam = searchParams.get("error")
    if (errorParam === "email_confirmation_failed") {
      setError("Email confirmation failed. Please try registering again or contact support.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        // Check if error is due to unconfirmed email
        if (error.message.includes("Email not confirmed") || error.message.includes("email_not_confirmed")) {
          setError("Please check your email and click the confirmation link before signing in.")
          return
        }
        throw error
      }
      
      // Check if user email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        setError("Please check your email and click the confirmation link to activate your account.")
        return
      }
      
      router.push("/")
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
            <CardTitle className="text-2xl font-semibold">MASE Behavioral Health EMR</CardTitle>
            <CardDescription>Sign in to access your clinical dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="provider@clinic.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Need an account?{" "}
              <Link href="/auth/register" className="text-primary hover:underline">
                Register as Provider
              </Link>
            </div>
            <div className="mt-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/auth/regulatory-login"
                  className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-muted-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Regulatory Portal Access
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
