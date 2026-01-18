import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function ClearinghouseLoading() {
  return (
    <PageLoadingSkeleton
      title="Clearinghouse"
      subtitle="Loading claims data..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={8}
    />
  )
}
