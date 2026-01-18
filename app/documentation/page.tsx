import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DocumentationContent } from "@/components/documentation-content"

const DEFAULT_PROVIDER = {
  id: "00000000-0000-0000-0000-000000000001",
  first_name: "Demo",
  last_name: "Provider",
  email: "demo@example.com",
  role: "physician",
}

export default async function DocumentationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams

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

  // Get pre-selected patient ID from URL params
  const preSelectedPatientId = typeof params.patient === "string" ? params.patient : undefined

  // Get patients for document creation dialog
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name")
    .order("first_name")

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6">
          <DocumentationContent
            providerId={provider.id}
            patients={patients || []}
            preSelectedPatientId={preSelectedPatientId}
            autoOpen={!!preSelectedPatientId}
          />
        </main>
      </div>
    </div>
  )
}
