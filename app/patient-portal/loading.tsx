import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function PatientPortalLoading() {
  return (
    <PageLoadingSkeleton
      title="Patient Portal"
      subtitle="Loading patient portal..."
      showStats={true}
      statsCount={4}
      showTable={false}
      showCards={true}
      cardsCount={6}
    />
  )
}
