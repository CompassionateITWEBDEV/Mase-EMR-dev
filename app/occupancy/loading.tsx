import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function OccupancyLoading() {
  return (
    <PageLoadingSkeleton
      title="Bed Occupancy"
      subtitle="Loading occupancy data..."
      showStats={true}
      statsCount={4}
      showTable={false}
      showCards={true}
      cardsCount={6}
    />
  )
}
