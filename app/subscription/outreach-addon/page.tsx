"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Heart, CheckCircle2, XCircle, Users, FileText, Shield, Calendar, BarChart3 } from "lucide-react"

export default function OutreachAddonPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      const response = await fetch("/api/outreach-subscription")
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error("Error loading subscription:", error)
    } finally {
      setLoading(false)
    }
  }

  const activateAddon = async (tier: string) => {
    try {
      const response = await fetch("/api/outreach-subscription/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      if (response.ok) {
        await loadSubscription()
      }
    } catch (error) {
      console.error("Error activating addon:", error)
    }
  }

  const cancelAddon = async () => {
    if (!confirm("Are you sure you want to cancel the Community Outreach add-on?")) return

    try {
      const response = await fetch("/api/outreach-subscription/cancel", {
        method: "POST",
      })

      if (response.ok) {
        await loadSubscription()
      }
    } catch (error) {
      console.error("Error cancelling addon:", error)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  const isActive = subscription?.status === "active"
  const isTrial = subscription?.status === "trial"
  const hasSubscription = isActive || isTrial

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-cyan-600" />
            <h1 className="text-3xl font-bold text-gray-900">Community Outreach Add-On</h1>
          </div>
          <p className="text-gray-600">
            Expand your reach with MASE Access™ - public-facing tools for community engagement, patient education, and
            provider collaboration
          </p>
        </div>

        {/* Current Subscription Status */}
        {hasSubscription && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Subscription</CardTitle>
                  <CardDescription>Your Community Outreach subscription details</CardDescription>
                </div>
                <Badge variant={isActive ? "default" : "secondary"} className="text-lg px-4 py-1">
                  {isTrial ? "Trial" : subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-500">Plan Tier</div>
                  <div className="text-xl font-semibold capitalize">{subscription.feature_tier}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Monthly Cost</div>
                  <div className="text-xl font-semibold">${subscription.monthly_price}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Screenings This Month</div>
                  <div className="text-xl font-semibold">
                    {subscription.current_month_screenings} / {subscription.max_monthly_screenings}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Referrals This Month</div>
                  <div className="text-xl font-semibold">
                    {subscription.current_month_referrals} / {subscription.max_monthly_referrals}
                  </div>
                </div>
              </div>

              {/* Usage Progress */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Screenings Usage</span>
                    <span>
                      {Math.round((subscription.current_month_screenings / subscription.max_monthly_screenings) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(subscription.current_month_screenings / subscription.max_monthly_screenings) * 100}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Referrals Usage</span>
                    <span>
                      {Math.round((subscription.current_month_referrals / subscription.max_monthly_referrals) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={(subscription.current_month_referrals / subscription.max_monthly_referrals) * 100}
                    className="h-2"
                  />
                </div>
              </div>

              {isTrial && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-900">Trial Period Active</div>
                      <div className="text-sm text-amber-700">
                        Your trial ends on {new Date(subscription.trial_end_date).toLocaleDateString()}. Upgrade to
                        continue using Community Outreach features.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                {isTrial && (
                  <Button onClick={() => activateAddon(subscription.feature_tier)}>Upgrade to Paid Plan</Button>
                )}
                {isActive && (
                  <Button variant="outline" onClick={cancelAddon}>
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Tiers */}
        {!hasSubscription && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Basic Tier */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">Basic</CardTitle>
                <div className="text-3xl font-bold">
                  $299<span className="text-lg font-normal text-gray-500">/mo</span>
                </div>
                <CardDescription>Perfect for small clinics starting with community engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full mb-6" onClick={() => activateAddon("basic")}>
                  Start 30-Day Free Trial
                </Button>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">100 anonymous screenings/month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">50 referral submissions/month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">10 external provider accounts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">ROI consent portal</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">Provider document submission</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-500">Advanced analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-500">Custom branding</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional Tier */}
            <Card className="relative border-2 border-cyan-600">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-cyan-600 text-white px-4 py-1">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="text-3xl font-bold">
                  $499<span className="text-lg font-normal text-gray-500">/mo</span>
                </div>
                <CardDescription>For growing programs with active outreach needs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full mb-6 bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => activateAddon("professional")}
                >
                  Start 30-Day Free Trial
                </Button>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">500 anonymous screenings/month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">200 referral submissions/month</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">50 external provider accounts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">ROI consent portal</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">Provider document submission</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm font-semibold">Advanced analytics dashboard</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                    <span className="text-sm text-gray-500">Custom branding</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enterprise Tier */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-3xl font-bold">
                  $999<span className="text-lg font-normal text-gray-500">/mo</span>
                </div>
                <CardDescription>Unlimited capacity for large-scale community programs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full mb-6 bg-transparent"
                  variant="outline"
                  onClick={() => activateAddon("enterprise")}
                >
                  Start 30-Day Free Trial
                </Button>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm font-semibold">Unlimited screenings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm font-semibold">Unlimited referrals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm font-semibold">Unlimited provider accounts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">ROI consent portal</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">Provider document submission</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm">Advanced analytics dashboard</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm font-semibold">Custom branding & white-label</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <span className="text-sm font-semibold">Dedicated account manager</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included with Community Outreach</CardTitle>
            <CardDescription>Transform your clinic into a community hub</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-cyan-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Public Access Portal</h3>
                  <p className="text-sm text-gray-600">
                    Anonymous screening tools, educational resources, and stigma-free access to treatment information
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Community Referral Gateway</h3>
                  <p className="text-sm text-gray-600">
                    Accept referrals from hospitals, shelters, courts, families, and self-referrals with intake tracking
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Secure Provider Portal</h3>
                  <p className="text-sm text-gray-600">
                    External providers can submit transfer documents securely with HIPAA/42 CFR Part 2 compliance
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Outreach Analytics</h3>
                  <p className="text-sm text-gray-600">
                    Track conversion rates, referral sources, and measure community impact with detailed reporting
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
