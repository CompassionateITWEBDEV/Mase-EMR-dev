import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function TelehealthLoading() {
  return (
    <PageLoadingSkeleton
      title="Telehealth"
      subtitle="Loading telehealth sessions..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={6}
    />
  )
}
