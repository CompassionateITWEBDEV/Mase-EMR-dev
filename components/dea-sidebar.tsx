"use client"

import { Shield, FileText, BarChart3, Users, Lock, AlertTriangle, Calendar, Download, Search, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePathname } from "next/navigation"
import Link from "next/link"

const navigationItems = [
  { icon: Home, label: "Overview", href: "/regulatory/dea", count: null },
  { icon: Shield, label: "Compliance Status", href: "/regulatory/dea/compliance", count: 2 },
  { icon: FileText, label: "Inventory Records", href: "/regulatory/dea/inventory", count: null },
  { icon: BarChart3, label: "Acquisition Logs", href: "/regulatory/dea/acquisitions", count: 1 },
  { icon: Users, label: "Dispensing Records", href: "/regulatory/dea/dispensing", count: null },
  { icon: Lock, label: "Security & Storage", href: "/regulatory/dea/security", count: null },
  { icon: AlertTriangle, label: "Violations & Issues", href: "/regulatory/dea/violations", count: 1 },
  { icon: Calendar, label: "Inspection History", href: "/regulatory/dea/inspections", count: null },
  { icon: Download, label: "Generate Reports", href: "/regulatory/dea/reports", count: null },
  { icon: Search, label: "Search Records", href: "/regulatory/dea/search", count: null },
]

export function DEASidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-blue-900 border-r border-blue-800">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-blue-900" />
          </div>
          <div>
            <span className="font-bold text-lg text-white">DEA Portal</span>
            <p className="text-xs text-blue-200">Compliance Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.label} href={item.href || "/regulatory/dea"}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive
                      ? "bg-white text-blue-900 hover:bg-white/90"
                      : "text-blue-100 hover:bg-blue-800 hover:text-white"
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

        <div className="mt-8 p-4 bg-blue-800 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Inspector Access</h4>
          <p className="text-xs text-blue-200">DEA-12345</p>
          <p className="text-xs text-blue-200">John Smith</p>
          <p className="text-xs text-blue-200 mt-2">Access expires: Jan 15, 2025</p>
        </div>
      </div>
    </aside>
  )
}
