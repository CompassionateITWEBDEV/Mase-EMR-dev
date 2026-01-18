// Feature flags based on subscription
export type FeatureFlag =
  | "e-prescribing"
  | "telehealth"
  | "lab-integration"
  | "medication-dispensing"
  | "clinical-protocols"
  | "billing-claims"
  | "clearinghouse"
  | "prior-auth"
  | "otp-bundle"
  | "pmp-integration"
  | "patient-portal"
  | "mobile-check-in"
  | "sms-reminders"
  | "staff-management"
  | "multi-location"
  | "workflows"
  | "ai-assistant"
  | "advanced-analytics"
  | "predictive-insights"
  | "community-outreach"
  | "research-dashboard"
  | "patient-credits"
  | "facility-inventory"
  | "county-health"
  | "chw-encounters"
  | "pt-ot-dashboard"

export type SubscriptionTier = "basic" | "professional" | "enterprise"

interface FeatureConfig {
  tier: SubscriptionTier
  monthlyPrice: number
  enabled: boolean
}

// Default feature configuration based on tier
export const featureDefaults: Record<FeatureFlag, FeatureConfig> = {
  "e-prescribing": { tier: "professional", monthlyPrice: 99, enabled: false },
  telehealth: { tier: "professional", monthlyPrice: 79, enabled: false },
  "lab-integration": { tier: "professional", monthlyPrice: 59, enabled: false },
  "medication-dispensing": { tier: "basic", monthlyPrice: 0, enabled: true },
  "clinical-protocols": { tier: "basic", monthlyPrice: 0, enabled: true },
  "billing-claims": { tier: "professional", monthlyPrice: 149, enabled: false },
  clearinghouse: { tier: "professional", monthlyPrice: 79, enabled: false },
  "prior-auth": { tier: "enterprise", monthlyPrice: 99, enabled: false },
  "otp-bundle": { tier: "professional", monthlyPrice: 49, enabled: false },
  "pmp-integration": { tier: "professional", monthlyPrice: 49, enabled: false },
  "patient-portal": { tier: "basic", monthlyPrice: 0, enabled: true },
  "mobile-check-in": { tier: "professional", monthlyPrice: 39, enabled: false },
  "sms-reminders": { tier: "professional", monthlyPrice: 29, enabled: false },
  "staff-management": { tier: "basic", monthlyPrice: 0, enabled: true },
  "multi-location": { tier: "enterprise", monthlyPrice: 199, enabled: false },
  workflows: { tier: "professional", monthlyPrice: 49, enabled: false },
  "ai-assistant": { tier: "enterprise", monthlyPrice: 199, enabled: false },
  "advanced-analytics": { tier: "enterprise", monthlyPrice: 149, enabled: false },
  "predictive-insights": { tier: "enterprise", monthlyPrice: 249, enabled: false },
  "community-outreach": { tier: "professional", monthlyPrice: 299, enabled: false },
  "research-dashboard": { tier: "enterprise", monthlyPrice: 199, enabled: false },
  "patient-credits": { tier: "professional", monthlyPrice: 49, enabled: false },
  "facility-inventory": { tier: "professional", monthlyPrice: 39, enabled: false },
  "county-health": { tier: "enterprise", monthlyPrice: 149, enabled: false },
  "chw-encounters": { tier: "professional", monthlyPrice: 79, enabled: false },
  "pt-ot-dashboard": { tier: "professional", monthlyPrice: 99, enabled: false },
}

// Check if a feature is enabled for the current subscription
export function isFeatureEnabled(
  feature: FeatureFlag,
  currentTier: SubscriptionTier,
  enabledAddOns: FeatureFlag[],
): boolean {
  const config = featureDefaults[feature]
  const tierOrder: Record<SubscriptionTier, number> = {
    basic: 0,
    professional: 1,
    enterprise: 2,
  }

  // Feature is included in tier
  if (tierOrder[currentTier] >= tierOrder[config.tier]) {
    return true
  }

  // Feature is an enabled add-on
  if (enabledAddOns.includes(feature)) {
    return true
  }

  return false
}

// Get all features available for a tier
export function getFeaturesForTier(tier: SubscriptionTier): FeatureFlag[] {
  const tierOrder: Record<SubscriptionTier, number> = {
    basic: 0,
    professional: 1,
    enterprise: 2,
  }

  return (Object.entries(featureDefaults) as [FeatureFlag, FeatureConfig][])
    .filter(([_, config]) => tierOrder[tier] >= tierOrder[config.tier])
    .map(([feature]) => feature)
}

// Calculate monthly cost for enabled features
export function calculateMonthlyCost(
  baseTier: SubscriptionTier,
  enabledAddOns: FeatureFlag[],
): { base: number; addOns: number; total: number } {
  const basePrices: Record<SubscriptionTier, number> = {
    basic: 299,
    professional: 599,
    enterprise: 999,
  }

  const base = basePrices[baseTier]
  const addOns = enabledAddOns.reduce((sum, feature) => {
    const config = featureDefaults[feature]
    // Only charge for add-ons if feature is not included in tier
    const tierOrder: Record<SubscriptionTier, number> = {
      basic: 0,
      professional: 1,
      enterprise: 2,
    }
    if (tierOrder[baseTier] < tierOrder[config.tier]) {
      return sum + config.monthlyPrice
    }
    return sum
  }, 0)

  return { base, addOns, total: base + addOns }
}
