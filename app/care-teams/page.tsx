"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { CareTeamManagement } from "@/components/care-team-management"
import { useAuth } from "@/lib/auth/rbac-hooks"
import { createClient } from "@/lib/supabase/client"

export default function CareTeamsPage() {
  const { user, loading: authLoading } = useAuth()
  const [currentProviderId, setCurrentProviderId] = useState<string>("")
  const [canManageTeams, setCanManageTeams] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getProviderId = async () => {
      if (authLoading) return

      try {
        if (!user) {
          setIsLoading(false)
          return
        }

        // Check if user is a provider
        const { data: providerData, error: providerError } = await supabase
          .from("providers")
          .select("id")
          .eq("id", user.id)
          .single()

        if (providerError || !providerData) {
          // User might be staff, check staff table
          const { data: staffData } = await supabase
            .from("staff")
            .select("id, role")
            .eq("id", user.id)
            .single()

          if (staffData) {
            // Staff can manage teams if they have appropriate role
            setCanManageTeams(
              ["admin", "case_manager", "supervisor"].includes(
                staffData.role || ""
              )
            )
            // For staff, use their user ID as provider ID for notifications
            setCurrentProviderId(user.id)
          }
        } else {
          // User is a provider
          setCurrentProviderId(providerData.id)
          setCanManageTeams(true)
        }
      } catch (error) {
        console.error("Error getting provider ID:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getProviderId()
  }, [user, authLoading, supabase])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="pl-64">
          <DashboardHeader />
          <main className="p-6 space-y-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="pl-64">
          <DashboardHeader />
          <main className="p-6 space-y-6">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-muted-foreground">
                Please log in to access care teams
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

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

          <CareTeamManagement 
            currentProviderId={currentProviderId || user.id} 
            canManageTeams={canManageTeams} 
          />
        </main>
      </div>
    </div>
  )
}
