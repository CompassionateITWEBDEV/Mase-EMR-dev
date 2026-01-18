import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DischargeSummaryList } from "@/components/discharge-summary-list"

export default function DischargeSummaryPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6">
          <DischargeSummaryList />
        </main>
      </div>
    </div>
  )
}
