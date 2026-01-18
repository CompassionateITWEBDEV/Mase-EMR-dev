import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { PatientCaseCommunications } from "@/components/patient-case-communications"

const DEFAULT_PROVIDER = {
  id: "00000000-0000-0000-0000-000000000001",
  first_name: "Demo",
  last_name: "Provider",
  email: "demo@example.com",
  role: "physician",
}

export default async function PatientCommunicationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  // Get patient information
  const { data: patient, error: patientError } = await supabase.from("patients").select("*").eq("id", id).single()

  if (patientError || !patient) {
    redirect("/patients")
  }

  // Get care team information
  const { data: careTeam } = await supabase
    .from("care_teams")
    .select(`
      *,
      care_team_members(
        *,
        providers(
          id,
          first_name,
          last_name,
          role,
          specialization
        )
      )
    `)
    .eq("patient_id", id)
    .eq("is_active", true)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                Case Communications
              </h1>
              <p className="text-muted-foreground">
                {patient.first_name} {patient.last_name} - Team Communication Hub
              </p>
            </div>
          </div>

          <PatientCaseCommunications patient={patient} careTeam={careTeam} currentProvider={provider} />
        </main>
      </div>
    </div>
  )
}
