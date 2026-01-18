import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function SubscriptionLoading() {
  return (
    <PageLoadingSkeleton
      title="Subscription"
      subtitle="Loading subscription details..."
      showStats={false}
      showTable={false}
      showCards={true}
      cardsCount={3}
    />
  )
}
