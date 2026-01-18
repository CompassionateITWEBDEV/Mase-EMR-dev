import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { PriorAuthorization } from "@/components/prior-authorization"

export default function PriorAuthPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6">
          <PriorAuthorization />
        </main>
      </div>
    </div>
  )
}
