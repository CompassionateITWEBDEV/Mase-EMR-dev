"use client"

import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { ComplianceAuditDashboard } from "@/components/compliance-audit-dashboard"

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <DashboardHeader />
        <main className="p-6">
          <ComplianceAuditDashboard />
        </main>
      </div>
    </div>
  )
}
