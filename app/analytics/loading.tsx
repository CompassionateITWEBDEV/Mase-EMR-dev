import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function AnalyticsLoading() {
  return (
    <PageLoadingSkeleton
      title="Analytics"
      subtitle="Loading analytics data..."
      showStats={true}
      statsCount={4}
      showTable={false}
      showCards={true}
      cardsCount={6}
    />
  )
}
