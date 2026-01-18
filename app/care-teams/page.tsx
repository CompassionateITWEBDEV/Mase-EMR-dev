"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { CareTeamManagement } from "@/components/care-team-management"

export default function CareTeamsPage() {
  const currentProviderId = "default-provider"
  const canManageTeams = true

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                Care Teams
              </h1>
              <p className="text-muted-foreground">
                Manage multidisciplinary care teams for collaborative patient care
              </p>
            </div>
          </div>

          <CareTeamManagement currentProviderId={currentProviderId} canManageTeams={canManageTeams} />
        </main>
      </div>
    </div>
  )
}
