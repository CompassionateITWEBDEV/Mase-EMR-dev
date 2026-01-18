import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function NotificationsLoading() {
  return (
    <PageLoadingSkeleton
      title="Notifications"
      subtitle="Loading notifications..."
      showStats={true}
      statsCount={3}
      showTable={true}
      tableRows={10}
    />
  )
}
