import { Suspense } from "react"
import { EPrescribingDashboard } from "@/components/e-prescribing-dashboard"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { FeatureGate } from "@/components/feature-gate"

export default function EPrescribingPage() {
  return (
    <FeatureGate feature="e-prescribing">
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">E-Prescribing</h1>
            <p className="text-gray-600 mt-2">Manage prescriptions and medication orders</p>
          </div>

          <Suspense fallback={<div>Loading e-prescribing dashboard...</div>}>
            <EPrescribingDashboard />
          </Suspense>
        </div>
      </div>
    </div>
    </FeatureGate>
  )
}
