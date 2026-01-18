import { Suspense } from "react"
import { MyWorkDashboard } from "@/components/my-work-dashboard"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function MyWorkPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Work</h1>
              <p className="text-muted-foreground">Your tasks, assignments, and work queue</p>
            </div>
          </div>
          <Suspense fallback={<div>Loading your work queue...</div>}>
            <MyWorkDashboard />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
