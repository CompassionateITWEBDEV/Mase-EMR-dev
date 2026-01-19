import { Suspense } from "react"
import { OutreachDashboard } from "@/components/outreach/outreach-dashboard"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Skeleton } from "@/components/ui/skeleton"

export default function OutreachPage() {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 ml-64">
        <Suspense fallback={<DashboardSkeleton />}>
          <OutreachDashboard />
        </Suspense>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}
