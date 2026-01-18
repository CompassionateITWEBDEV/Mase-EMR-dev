import { Suspense } from "react"
import { LabIntegrationDashboard } from "@/components/lab-integration-dashboard"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Skeleton } from "@/components/ui/skeleton"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-[500px] w-full" />
    </div>
  )
}

export default function LabIntegrationPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Lab Integration</h1>
            <p className="text-muted-foreground mt-2">Manage lab orders and results with bi-directional integration</p>
          </div>

          <Suspense fallback={<LoadingSkeleton />}>
            <LabIntegrationDashboard />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
