import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function TakehomeLoading() {
  return (
    <PageLoadingSkeleton
      title="Take-Home Management"
      subtitle="Loading take-home records..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={8}
    />
  )
}
