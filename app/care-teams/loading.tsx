import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function CareTeamsLoading() {
  return (
    <PageLoadingSkeleton
      title="Care Teams"
      subtitle="Loading care team information..."
      showStats={true}
      statsCount={4}
      showTable={true}
      tableRows={6}
    />
  )
}
