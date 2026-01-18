import { Suspense } from "react"
import { AdvancedReportingDashboard } from "@/components/advanced-reporting-dashboard"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Advanced Reports</h1>
            <p className="text-gray-600 mt-2">
              Productivity, financial, and compliance reporting for improved accountability
            </p>
          </div>

          <Suspense fallback={<div>Loading advanced reporting dashboard...</div>}>
            <AdvancedReportingDashboard />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
