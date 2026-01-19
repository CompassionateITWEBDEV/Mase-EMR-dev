import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function LandingLoading() {
  return (
    <PageLoadingSkeleton
      title="Welcome"
      subtitle="Loading dashboard..."
      showStats={true}
      statsCount={4}
      showTable={false}
      showCards={true}
      cardsCount={6}
    />
  )
}
