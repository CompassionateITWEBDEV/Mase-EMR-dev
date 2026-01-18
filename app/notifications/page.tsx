import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { TeamNotifications } from "@/components/team-notifications"

const DEFAULT_PROVIDER = {
  id: "00000000-0000-0000-0000-000000000001",
  first_name: "Demo",
  last_name: "Provider",
  email: "demo@example.com",
  role: "physician",
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  let provider = DEFAULT_PROVIDER
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: providerData } = await supabase.from("providers").select("*").eq("id", user.id).single()
      if (providerData) {
        provider = providerData
      }
    }
  } catch (error) {
    console.log("[v0] Auth check failed, using default provider")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                Notifications
              </h1>
              <p className="text-muted-foreground">Stay updated on patient cases and team communications</p>
            </div>
          </div>

          <TeamNotifications providerId={provider.id} />
        </main>
      </div>
    </div>
  )
}
