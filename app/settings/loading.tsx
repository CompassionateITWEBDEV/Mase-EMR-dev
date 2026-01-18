import { PageLoadingSkeleton } from "@/components/page-loading-skeleton"

export default function SettingsLoading() {
  return (
    <PageLoadingSkeleton
      title="Settings"
      subtitle="Loading settings..."
      showStats={false}
      showTable={false}
      showCards={true}
      cardsCount={4}
    />
  )
}
