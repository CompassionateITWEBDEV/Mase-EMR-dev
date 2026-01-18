"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuthToggle } from "@/lib/dev-tools/auth-toggle-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Settings, X, GripVertical, Shield, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

const POSITION_STORAGE_KEY = "dev_auth_toggle_panel_position"
const DEFAULT_POSITION = { x: 20, y: 20 }

export function AuthTogglePanel() {
  const { bypassAuth, disableTokenRefresh, setBypassAuth, setDisableTokenRefresh, isDevMode } =
    useAuthToggle()
  const [isExpanded, setIsExpanded] = useState(false)
  const [position, setPosition] = useState(DEFAULT_POSITION)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)

  // Ensure component only renders after client-side hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load saved position from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const saved = localStorage.getItem(POSITION_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { x: number; y: number }
        setPosition(parsed)
      }
    } catch (error) {
      console.warn("[DevTools] Error loading panel position:", error)
    }
  }, [])

  // Save position to localStorage
  const savePosition = useCallback((pos: { x: number; y: number }) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos))
    } catch (error) {
      console.warn("[DevTools] Error saving panel position:", error)
    }
  }, [])

  // Handle drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!panelRef.current || !dragHandleRef.current?.contains(e.target as Node)) return

      e.preventDefault()
      setIsDragging(true)

      const rect = panelRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    },
    []
  )

  // Handle drag
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Constrain to viewport
      const maxX = window.innerWidth - (panelRef.current?.offsetWidth || 300)
      const maxY = window.innerHeight - (panelRef.current?.offsetHeight || 200)

      const constrainedX = Math.max(0, Math.min(newX, maxX))
      const constrainedY = Math.max(0, Math.min(newY, maxY))

      setPosition({ x: constrainedX, y: constrainedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect()
        savePosition({ x: rect.left, y: rect.top })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset, savePosition])

  // Don't render until after client-side hydration to prevent hydration mismatch
  // Always return null on server and during initial render
  if (!isMounted) {
    return null
  }

  // Don't render if not in dev mode (only check after mount)
  if (!isDevMode) {
    // Only show debug on client-side (after hydration)
    if (process.env.NODE_ENV === "development") {
      console.log("[DevTools] Panel not showing. To enable:", {
        method1: "Add NEXT_PUBLIC_ENABLE_DEV_TOOLS=true to .env.local and restart dev server",
        method2: "Run: localStorage.setItem('dev_tools_enabled', 'true'); location.reload()",
        currentState: {
          nodeEnv: process.env.NODE_ENV,
          enableDevTools: process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS,
          localStorageCheck: window.localStorage.getItem("dev_tools_enabled"),
        },
      })
    }
    return null
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-[9999] transition-all duration-200",
        isExpanded ? "w-80" : "w-auto"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "default",
      }}
      onMouseDown={handleMouseDown}
    >
      {isExpanded ? (
        <Card className="shadow-lg border-2 border-orange-500/50 bg-background/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-orange-600" />
                <CardTitle className="text-sm font-semibold">Dev Auth Controls</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <div
                  ref={dragHandleRef}
                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
                  title="Drag to move"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Bypass Authentication Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <label
                    htmlFor="bypass-auth"
                    className="text-sm font-medium cursor-pointer select-none"
                  >
                    Bypass Authentication
                  </label>
                </div>
                <Switch
                  id="bypass-auth"
                  checked={bypassAuth}
                  onCheckedChange={setBypassAuth}
                />
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Allows access to protected routes without valid credentials
              </p>
              {bypassAuth && (
                <Badge variant="destructive" className="ml-6 text-xs">
                  ⚠️ Auth Bypass Active
                </Badge>
              )}
            </div>

            {/* Disable Token Refresh Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <label
                    htmlFor="disable-refresh"
                    className="text-sm font-medium cursor-pointer select-none"
                  >
                    Disable Token Refresh
                  </label>
                </div>
                <Switch
                  id="disable-refresh"
                  checked={disableTokenRefresh}
                  onCheckedChange={setDisableTokenRefresh}
                />
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Prevents automatic token refresh from executing
              </p>
              {disableTokenRefresh && (
                <Badge variant="destructive" className="ml-6 text-xs">
                  ⚠️ Auto-Refresh Disabled
                </Badge>
              )}
            </div>

            {/* Warning Banner */}
            {(bypassAuth || disableTokenRefresh) && (
              <div className="mt-4 p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md">
                <p className="text-xs text-orange-800 dark:text-orange-200 font-medium">
                  ⚠️ Developer Mode Active
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  These settings are for testing only and should never be used in production.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg border-orange-500/50 bg-background/95 backdrop-blur-sm hover:bg-orange-50 dark:hover:bg-orange-950/20"
          onClick={() => setIsExpanded(true)}
          title="Open Dev Auth Controls"
        >
          <Settings className="h-5 w-5 text-orange-600" />
          {(bypassAuth || disableTokenRefresh) && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background" />
          )}
        </Button>
      )}
    </div>
  )
}

