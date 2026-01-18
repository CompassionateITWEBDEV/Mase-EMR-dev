import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function WaitingListLoading() {
  return (
    <PageLoadingSkeleton
      title="Waiting List"
      subtitle="Loading waiting list..."
      showStats={true}
      statsCount={3}
      showTable={true}
      tableRows={10}
    />
  )
}
