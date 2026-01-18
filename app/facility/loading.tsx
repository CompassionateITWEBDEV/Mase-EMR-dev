import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function FacilityLoading() {
  return (
    <PageLoadingSkeleton
      title="Facility Management"
      subtitle="Loading facility information..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={6}
    />
  )
}
