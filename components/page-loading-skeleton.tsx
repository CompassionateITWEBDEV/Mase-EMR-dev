import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface PageLoadingSkeletonProps {
  title?: string
  subtitle?: string
  showStats?: boolean
  statsCount?: number
  showTable?: boolean
  tableRows?: number
  showCards?: boolean
  cardsCount?: number
}

/**
 * PageLoadingSkeleton - A reusable loading skeleton for dashboard pages
 * 
 * Provides consistent loading states across the application with customizable
 * sections for stats, tables, and cards.
 */
export function PageLoadingSkeleton({
  title = "Loading...",
  subtitle,
  showStats = true,
  statsCount = 4,
  showTable = true,
  tableRows = 5,
  showCards = false,
  cardsCount = 3,
}: PageLoadingSkeletonProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader title={title} subtitle={subtitle} />
        <main className="p-6 space-y-6">
          {/* Stats Row */}
          {showStats && (
            <div className={`grid grid-cols-2 md:grid-cols-${Math.min(statsCount, 4)} gap-4`}>
              {[...Array(statsCount)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Main Content Card with Table */}
          {showTable && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                {/* Search/Filter Bar */}
                <div className="flex gap-4 mb-6">
                  <Skeleton className="h-10 flex-1 max-w-md" />
                  <Skeleton className="h-10 w-40" />
                </div>

                {/* Table Skeleton */}
                <div className="space-y-3">
                  {/* Table Header */}
                  <div className="flex items-center gap-4 pb-3 border-b">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24 hidden md:block" />
                    <Skeleton className="h-4 w-28 hidden lg:block" />
                    <Skeleton className="h-4 w-20 hidden xl:block" />
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </div>
                  
                  {/* Table Rows */}
                  {[...Array(tableRows)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b last:border-0">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-6 w-20 hidden md:block" />
                      <Skeleton className="h-4 w-24 hidden lg:block" />
                      <Skeleton className="h-4 w-20 hidden xl:block" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cards Grid */}
          {showCards && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(cardsCount)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

/**
 * SimpleLoadingSkeleton - A minimal loading skeleton without sidebar
 */
export function SimpleLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md px-4">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32 mx-auto" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
