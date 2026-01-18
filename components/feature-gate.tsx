"use client"

import type { ReactNode } from "react"
import { useFeatureFlag } from "@/hooks/use-feature-flag"
import type { FeatureFlag } from "@/lib/subscription/feature-flags"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Crown } from "lucide-react"
import Link from "next/link"

interface FeatureGateProps {
  feature: FeatureFlag
  children: ReactNode
  fallback?: ReactNode
  showUpgradePrompt?: boolean
}

export function FeatureGate({ feature, children, fallback, showUpgradePrompt = true }: FeatureGateProps) {
  const isEnabled = useFeatureFlag(feature)

  if (isEnabled) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUpgradePrompt) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Lock className="h-12 w-12 mx-auto mb-4" style={{ color: "#64748b" }} />
          <h3 className="text-lg font-semibold mb-2">Feature Not Available</h3>
          <p className="text-sm mb-4" style={{ color: "#64748b" }}>
            This feature requires an upgrade to your subscription plan.
          </p>
          <Link href="/subscription">
            <Button>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Subscription
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return null
}
