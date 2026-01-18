import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function AppointmentsLoading() {
  return (
    <PageLoadingSkeleton
      title="Appointments"
      subtitle="Loading appointment schedule..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={8}
    />
  )
}
