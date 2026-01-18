import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DischargeSummaryForm } from "@/components/discharge-summary-form"

export default function NewDischargeSummaryPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6">
          <DischargeSummaryForm />
        </main>
      </div>
    </div>
  )
}
