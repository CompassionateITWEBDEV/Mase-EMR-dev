import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function DischargeSummaryLoading() {
  return (
    <PageLoadingSkeleton
      title="Discharge Summaries"
      subtitle="Loading discharge summaries..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={6}
    />
  )
}
