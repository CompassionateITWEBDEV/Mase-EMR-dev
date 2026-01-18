"use client"

import { useState, useEffect } from "react"
import type { FeatureFlag, SubscriptionTier } from "@/lib/subscription/feature-flags"
import { isFeatureEnabled } from "@/lib/subscription/feature-flags"

interface SubscriptionState {
  tier: SubscriptionTier
  enabledAddOns: FeatureFlag[]
}

// All available feature flags
const ALL_FEATURES: FeatureFlag[] = [
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
  "community-outreach",
  "research-dashboard",
  "patient-credits",
  "facility-inventory",
  "county-health",
  "chw-encounters",
  "pt-ot-dashboard",
]

/**
 * Check if development mode with all features enabled is active
 * Enable by setting NEXT_PUBLIC_ENABLE_ALL_FEATURES=true in .env
 * Or by setting localStorage key 'dev_enable_all_features' to 'true'
 */
function isDevModeAllFeaturesEnabled(): boolean {
  // Check environment variable first
  if (process.env.NEXT_PUBLIC_ENABLE_ALL_FEATURES === "true") {
    return true
  }
  
  // Check localStorage for runtime toggle (client-side only)
  if (typeof window !== "undefined") {
    return localStorage.getItem("dev_enable_all_features") === "true"
  }
  
  return false
}

// Hook to check if a feature is enabled
export function useFeatureFlag(feature: FeatureFlag): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // Development mode: enable all features for testing
    if (isDevModeAllFeaturesEnabled()) {
      setEnabled(true)
      return
    }

    // Production mode: check subscription
    const subscription: SubscriptionState = {
      tier: "enterprise", // Using enterprise tier for full access
      enabledAddOns: ALL_FEATURES, // All features enabled as add-ons
    }

    setEnabled(isFeatureEnabled(feature, subscription.tier, subscription.enabledAddOns))
  }, [feature])

  return enabled
}

// Hook to get all feature flags
export function useFeatureFlags(): Record<FeatureFlag, boolean> {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>({} as Record<FeatureFlag, boolean>)

  useEffect(() => {
    // Development mode: enable all features for testing
    if (isDevModeAllFeaturesEnabled()) {
      const newFlags = {} as Record<FeatureFlag, boolean>
      ALL_FEATURES.forEach((feature) => {
        newFlags[feature] = true
      })
      setFlags(newFlags)
      return
    }

    // Production mode: check subscription
    const subscription: SubscriptionState = {
      tier: "enterprise", // Using enterprise tier for full access
      enabledAddOns: ALL_FEATURES, // All features enabled as add-ons
    }

    const newFlags = {} as Record<FeatureFlag, boolean>
    ALL_FEATURES.forEach((feature) => {
      newFlags[feature] = isFeatureEnabled(feature, subscription.tier, subscription.enabledAddOns)
    })

    setFlags(newFlags)
  }, [])

  return flags
}

/**
 * Utility function to enable all features for development testing
 * Call this from browser console: enableAllFeatures()
 */
export function enableAllFeatures(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("dev_enable_all_features", "true")
    console.log("✅ All features enabled for development testing. Refresh the page to apply.")
    window.location.reload()
  }
}

/**
 * Utility function to disable development mode and use normal subscription
 * Call this from browser console: disableAllFeatures()
 */
export function disableAllFeatures(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("dev_enable_all_features")
    console.log("❌ Development mode disabled. Refresh the page to apply.")
    window.location.reload()
  }
}

/**
 * Check if all features are currently enabled
 */
export function areAllFeaturesEnabled(): boolean {
  return isDevModeAllFeaturesEnabled()
}
