import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Skeleton loader for patient cards
 */
export function SkeletonPatientCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Multiple skeleton patient cards
 */
export function SkeletonPatientCards({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPatientCard key={i} />
      ))}
    </div>
  )
}

