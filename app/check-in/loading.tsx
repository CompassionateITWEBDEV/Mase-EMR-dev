import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function CheckInLoading() {
  return (
    <PageLoadingSkeleton
      title="Check-In Queue"
      subtitle="Loading check-in queue..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={8}
    />
  )
}
