import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="w-64 border-r bg-white">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b bg-white">
          <Skeleton className="h-full w-full" />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    </div>
  )
}
