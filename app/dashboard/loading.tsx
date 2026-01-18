import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function DashboardLoading() {
  return (
    <PageLoadingSkeleton
      title="Dashboard"
      subtitle="Loading your dashboard..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={5}
    />
  )
}
