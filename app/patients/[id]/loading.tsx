import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function PatientDetailLoading() {
  return (
    <PageLoadingSkeleton
      title="Patient Details"
      subtitle="Loading patient information..."
      showStats={true}
      statsCount={4}
      showTable={false}
      showCards={true}
      cardsCount={6}
    />
  )
}
