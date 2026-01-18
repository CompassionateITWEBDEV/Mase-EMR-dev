import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function PriorAuthLoading() {
  return (
    <PageLoadingSkeleton
      title="Prior Authorization"
      subtitle="Loading authorization requests..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={8}
    />
  )
}
