import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function BillingLoading() {
  return (
    <PageLoadingSkeleton
      title="Billing"
      subtitle="Loading billing information..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={8}
    />
  )
}
