import { Suspense } from "react"
import { ClinicalProtocolsDashboard } from "@/components/clinical-protocols-dashboard"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function ClinicalProtocolsPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 lg:pl-64">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Clinical Protocols</h1>
            <p className="text-gray-600 mt-2">Manage COWS, CIWA, vitals, and clinical assessment protocols</p>
          </div>

          <Suspense fallback={<div>Loading clinical protocols dashboard...</div>}>
            <ClinicalProtocolsDashboard />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
