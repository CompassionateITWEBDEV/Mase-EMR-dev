import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function DispensingLoading() {
  return (
    <PageLoadingSkeleton
      title="Medication Dispensing"
      subtitle="Loading dispensing records..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={8}
    />
  )
}
