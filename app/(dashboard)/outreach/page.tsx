import { Suspense } from "react"
import { OutreachDashboard } from "@/components/outreach/outreach-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export default function OutreachPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <OutreachDashboard />
    </Suspense>
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
