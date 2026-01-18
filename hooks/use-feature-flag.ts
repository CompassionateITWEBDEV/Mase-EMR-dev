"use client"

import { useState, useEffect } from "react"
import type { FeatureFlag, SubscriptionTier } from "@/lib/subscription/feature-flags"
import { isFeatureEnabled } from "@/lib/subscription/feature-flags"

interface SubscriptionState {
  tier: SubscriptionTier
  enabledAddOns: FeatureFlag[]
}

// Hook to check if a feature is enabled
export function useFeatureFlag(feature: FeatureFlag): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // In a real app, this would fetch from API/context
    const subscription: SubscriptionState = {
      tier: "professional",
      enabledAddOns: [
        "e-prescribing",
        "telehealth",
        "lab-integration",
        "billing-claims",
        "clearinghouse",
        "otp-bundle",
        "pmp-integration",
        "mobile-check-in",
        "sms-reminders",
        "workflows",
      ],
    }

    setEnabled(isFeatureEnabled(feature, subscription.tier, subscription.enabledAddOns))
  }, [feature])

  return enabled
}

// Hook to get all feature flags
export function useFeatureFlags(): Record<FeatureFlag, boolean> {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>({} as Record<FeatureFlag, boolean>)

  useEffect(() => {
    // In a real app, this would fetch from API/context
    const subscription: SubscriptionState = {
      tier: "professional",
      enabledAddOns: [
        "e-prescribing",
        "telehealth",
        "lab-integration",
        "billing-claims",
        "clearinghouse",
        "otp-bundle",
        "pmp-integration",
        "mobile-check-in",
        "sms-reminders",
        "workflows",
      ],
    }

    const allFeatures: FeatureFlag[] = [
      "e-prescribing",
      "telehealth",
      "lab-integration",
      "medication-dispensing",
      "clinical-protocols",
      "billing-claims",
      "clearinghouse",
      "prior-auth",
      "otp-bundle",
      "pmp-integration",
      "patient-portal",
      "mobile-check-in",
      "sms-reminders",
      "staff-management",
      "multi-location",
      "workflows",
      "ai-assistant",
      "advanced-analytics",
      "predictive-insights",
    ]

    const newFlags = {} as Record<FeatureFlag, boolean>
    allFeatures.forEach((feature) => {
      newFlags[feature] = isFeatureEnabled(feature, subscription.tier, subscription.enabledAddOns)
    })

    setFlags(newFlags)
  }, [])

  return flags
}
