import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { BillingDashboard } from "@/components/billing-dashboard"

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6">
          <BillingDashboard />
        </main>
      </div>
    </div>
  )
}
