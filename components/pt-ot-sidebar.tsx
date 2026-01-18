"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  Users,
  Calendar,
  ClipboardList,
  FileText,
  BarChart3,
  CreditCard,
  Brain,
  Dumbbell,
  Hand,
  MessageCircle,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PTOTSidebarProps {
  userRole: string
  specialty?: string
  onNavigate?: (tab: string) => void // Added callback for tab navigation
}

export function PTOTSidebar({ userRole, specialty, onNavigate }: PTOTSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem("ptot_session")
    router.push("/auth/pt-ot-login")
  }

  // Physical Therapy specific navigation
  const ptNavigation = [
    { name: "Dashboard", tab: "dashboard", icon: Home },
    { name: "Patients", tab: "patients", icon: Users },
    { name: "Schedule", tab: "schedule", icon: Calendar },
    { name: "HEP Programs", tab: "hep", icon: Dumbbell },
    { name: "RTM Monitoring", tab: "rtm", icon: Activity },
    { name: "Documentation", tab: "documentation", icon: FileText },
    { name: "Billing & Claims", tab: "billing", icon: CreditCard },
    { name: "Exercise Library", tab: "exercises", icon: ClipboardList },
    { name: "AI Coach", tab: "ai-coach", icon: Brain },
    { name: "Analytics", tab: "analytics", icon: BarChart3 },
  ]

  // Occupational Therapy specific navigation
  const otNavigation = [
    { name: "Dashboard", tab: "dashboard", icon: Home },
    { name: "Patients", tab: "patients", icon: Users },
    { name: "Schedule", tab: "schedule", icon: Calendar },
    { name: "Activity Programs", tab: "hep", icon: Hand },
    { name: "ADL Training", tab: "adl", icon: ClipboardList },
    { name: "RTM Monitoring", tab: "rtm", icon: Activity },
    { name: "Documentation", tab: "documentation", icon: FileText },
    { name: "Billing & Claims", tab: "billing", icon: CreditCard },
    { name: "AI Coach", tab: "ai-coach", icon: Brain },
    { name: "Analytics", tab: "analytics", icon: BarChart3 },
  ]

  // Speech-Language Pathology specific navigation
  const slpNavigation = [
    { name: "Dashboard", tab: "dashboard", icon: Home },
    { name: "Patients", tab: "patients", icon: Users },
    { name: "Schedule", tab: "schedule", icon: Calendar },
    { name: "Speech Programs", tab: "hep", icon: MessageCircle },
    { name: "Swallowing Evals", tab: "swallow", icon: ClipboardList },
    { name: "RTM Monitoring", tab: "rtm", icon: Activity },
    { name: "Documentation", tab: "documentation", icon: FileText },
    { name: "Billing & Claims", tab: "billing", icon: CreditCard },
    { name: "AI Coach", tab: "ai-coach", icon: Brain },
    { name: "Analytics", tab: "analytics", icon: BarChart3 },
  ]

  const navigation = userRole === "OT" ? otNavigation : userRole === "SLP" ? slpNavigation : ptNavigation

  const roleColors = {
    PT: "bg-blue-500",
    OT: "bg-green-500",
    SLP: "bg-purple-500",
  }

  const roleColor = roleColors[userRole as keyof typeof roleColors] || roleColors.PT

  return (
    <div className={cn("fixed left-0 top-0 z-40 h-screen border-r bg-card", isCollapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", roleColor)}>
              {userRole === "OT" ? (
                <Hand className="h-4 w-4 text-white" />
              ) : userRole === "SLP" ? (
                <MessageCircle className="h-4 w-4 text-white" />
              ) : (
                <Dumbbell className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold">
                {userRole === "OT"
                  ? "Occupational Therapy"
                  : userRole === "SLP"
                    ? "Speech-Language"
                    : "Physical Therapy"}
              </h2>
              {specialty && <p className="text-xs text-muted-foreground">{specialty}</p>}
            </div>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
          <ChevronRight className={cn("h-4 w-4 transition-transform", !isCollapsed && "rotate-180")} />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn("w-full justify-start", isCollapsed && "justify-center")}
                onClick={() => onNavigate?.(item.tab)} // Call navigation callback
              >
                <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                {!isCollapsed && <span>{item.name}</span>}
              </Button>
            )
          })}
        </nav>

        {!isCollapsed && (
          <div className="mt-6 pt-6 border-t">
            <Button variant="ghost" className="w-full justify-start" onClick={() => onNavigate?.("settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start text-red-600" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

export default PTOTSidebar
