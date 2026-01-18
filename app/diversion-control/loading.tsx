import { Skeleton } from "@/components/ui/skeleton"

export default function DiversionControlLoading() {
  return (
    <div className="min-h-screen bg-background p-6">
      <Skeleton className="h-10 w-64 mb-6" />
      <div className="grid grid-cols-6 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}
