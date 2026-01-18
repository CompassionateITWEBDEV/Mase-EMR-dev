"use client"

import {
  FileCheck,
  Star,
  Heart,
  Users,
  Clipboard,
  BarChart3,
  Shield,
  AlertTriangle,
  Search,
  Home,
  Target,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePathname } from "next/navigation"
import Link from "next/link"

const navigationItems = [
  { icon: Home, label: "Overview", href: "/regulatory/joint-commission", count: null },
  { icon: Star, label: "Standards Review", href: "/regulatory/joint-commission/standards", count: 1 },
  { icon: Target, label: "Quality Measures", href: "/regulatory/joint-commission/quality", count: null },
  { icon: Heart, label: "Patient Safety", href: "/regulatory/joint-commission/safety", count: 3 },
  { icon: Users, label: "Staff Competency", href: "/regulatory/joint-commission/staff", count: 2 },
  { icon: Clipboard, label: "Documentation", href: "/regulatory/joint-commission/docs", count: 1 },
  { icon: Activity, label: "Performance Data", href: "/regulatory/joint-commission/performance", count: null },
  { icon: Shield, label: "Risk Management", href: "/regulatory/joint-commission/risk", count: null },
  { icon: AlertTriangle, label: "Action Items", href: "/regulatory/joint-commission/actions", count: 3 },
  { icon: BarChart3, label: "Survey Reports", href: "/regulatory/joint-commission/reports", count: null },
  { icon: Search, label: "Evidence Search", href: "/regulatory/joint-commission/search", count: null },
]

export function JointCommissionSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-emerald-800 border-r border-emerald-700">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-emerald-800" />
          </div>
          <div>
            <span className="font-bold text-lg text-white">JC Portal</span>
            <p className="text-xs text-emerald-200">Survey Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.label} href={item.href || "/regulatory/joint-commission"}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive
                      ? "bg-white text-emerald-800 hover:bg-white/90"
                      : "text-emerald-100 hover:bg-emerald-700 hover:text-white"
                  }`}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                  {item.count && (
                    <Badge variant="destructive" className="ml-auto">
                      {item.count}
                    </Badge>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="mt-8 p-4 bg-emerald-700 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Surveyor Access</h4>
          <p className="text-xs text-emerald-200">JC-67890</p>
          <p className="text-xs text-emerald-200">Mary Johnson</p>
          <p className="text-xs text-emerald-200 mt-2">Access expires: Feb 15, 2025</p>
        </div>
      </div>
    </aside>
  )
}
