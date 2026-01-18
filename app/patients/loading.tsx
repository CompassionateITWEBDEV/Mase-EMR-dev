import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function PatientsLoading() {
  return (
    <PageLoadingSkeleton
      title="Patients"
      subtitle="Loading patient records..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={10}
    />
  )
}
