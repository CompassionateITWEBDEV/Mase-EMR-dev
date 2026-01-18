"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { TelehealthDashboard } from "@/components/telehealth-dashboard"

export default function TelehealthPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <TelehealthDashboard />
        </main>
      </div>
    </div>
  )
}
