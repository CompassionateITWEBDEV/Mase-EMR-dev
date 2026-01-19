"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  enableAllFeatures, 
  disableAllFeatures, 
  areAllFeaturesEnabled,
} from "@/hooks/use-feature-flag"
import { Sparkles, Settings2 } from "lucide-react"

/**
 * Development Feature Flag Toggle
 * 
 * Shows a floating button to toggle all features on/off for testing.
 * Only visible in development mode.
 */
export function FeatureFlagToggle() {
  const [allEnabled, setAllEnabled] = useState(false)
  const [isDevMode, setIsDevMode] = useState(false)

  useEffect(() => {
    // Only show in development mode
    const isDev = process.env.NODE_ENV === "development" || 
                  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true"
    setIsDevMode(isDev)
    
    // Check current state
    setAllEnabled(areAllFeaturesEnabled())

    // Expose functions globally for console access
    if (typeof window !== "undefined") {
      ;(window as any).enableAllFeatures = enableAllFeatures
      ;(window as any).disableAllFeatures = disableAllFeatures
      ;(window as any).areAllFeaturesEnabled = areAllFeaturesEnabled
      
      // Log helpful message
      if (isDev) {
        console.log(
          "%c🛠️ Dev Tools Available",
          "color: #0ea5e9; font-weight: bold; font-size: 14px;"
        )
        console.log(
          "%cFeature Flags:",
          "color: #64748b; font-weight: bold;"
        )
        console.log("  enableAllFeatures()  - Enable all premium features")
        console.log("  disableAllFeatures() - Disable dev mode features")
        console.log("  areAllFeaturesEnabled() - Check current state")
        console.log("")
        console.log(
          `%cCurrent State: ${areAllFeaturesEnabled() ? "✅ All Features ENABLED" : "⚠️ Normal Subscription Mode"}`,
          areAllFeaturesEnabled() ? "color: #22c55e; font-weight: bold;" : "color: #f59e0b; font-weight: bold;"
        )
      }
    }
  }, [])

  const handleToggle = (enabled: boolean) => {
    if (enabled) {
      enableAllFeatures()
    } else {
      disableAllFeatures()
    }
  }

  // Don't render in production
  if (!isDevMode) return null

  return (
    <div className="fixed bottom-4 left-20 z-50">
      {allEnabled && (
        <Badge 
          className="absolute -top-2 -left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-0.5 z-10"
        >
          DEV
        </Badge>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={`h-12 w-12 rounded-full shadow-lg ${
              allEnabled 
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600" 
                : "bg-white hover:bg-gray-100"
            }`}
            aria-label="Feature flag settings"
          >
            {allEnabled ? (
              <Sparkles className="h-5 w-5" />
            ) : (
              <Settings2 className="h-5 w-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 p-4" align="start" side="top">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">🛠️ Development Tools</h4>
              <p className="text-xs text-muted-foreground">
                Toggle feature flags for testing premium features.
              </p>
            </div>
            
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="all-features" className="text-sm font-medium">
                  Enable All Features
                </Label>
                <p className="text-xs text-muted-foreground">
                  Unlock all premium add-ons for testing
                </p>
              </div>
              <Switch
                id="all-features"
                checked={allEnabled}
                onCheckedChange={handleToggle}
              />
            </div>

            {allEnabled && (
              <div className="rounded-md bg-gradient-to-r from-purple-50 to-pink-50 p-3 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">
                    All Features Active
                  </span>
                </div>
                <p className="text-xs text-purple-600">
                  27 premium features unlocked for development testing.
                </p>
              </div>
            )}

            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">
                <strong>Console Commands:</strong>
                <br />
                <code className="text-[10px] bg-gray-100 px-1 rounded">enableAllFeatures()</code>
                <br />
                <code className="text-[10px] bg-gray-100 px-1 rounded">disableAllFeatures()</code>
              </p>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
