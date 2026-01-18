import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DocumentationOverview } from "@/components/documentation-overview"
import { DocumentList } from "@/components/document-list"
import { CreateDocumentDialog } from "@/components/create-document-dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"

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

  // Get search and filter parameters
  const search = typeof params.search === "string" ? params.search : ""
  const status = typeof params.status === "string" ? params.status : "all"
  const docType = typeof params.type === "string" ? params.type : "all"

  // Fetch assessments and progress notes
  const { data: assessments } = await supabase
    .from("assessments")
    .select(`
      *,
      patients(
        id,
        first_name,
        last_name
      ),
      providers(
        id,
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })

  const { data: progressNotes } = await supabase
    .from("progress_notes")
    .select(`
      *,
      patients(
        id,
        first_name,
        last_name
      ),
      providers(
        id,
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false })

  // Get patients for document creation
  const { data: patients } = await supabase.from("patients").select("id, first_name, last_name").order("first_name")

  // Calculate document statistics
  const totalAssessments = assessments?.length || 0
  const totalProgressNotes = progressNotes?.length || 0
  const recentDocuments = [
    ...(assessments?.slice(0, 10) || []).map((doc) => ({
      ...doc,
      document_type: "assessment",
      patient_name: `${doc.patients?.first_name || "Unknown"} ${doc.patients?.last_name || "Patient"}`,
      provider_name: `${doc.providers?.first_name || "Unknown"} ${doc.providers?.last_name || "Provider"}`,
    })),
    ...(progressNotes?.slice(0, 10) || []).map((doc) => ({
      ...doc,
      document_type: "progress_note",
      patient_name: `${doc.patients?.first_name || "Unknown"} ${doc.patients?.last_name || "Patient"}`,
      provider_name: `${doc.providers?.first_name || "Unknown"} ${doc.providers?.last_name || "Provider"}`,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)

  const documentStats = {
    assessments: totalAssessments,
    progressNotes: totalProgressNotes,
    total: totalAssessments + totalProgressNotes,
    pending: recentDocuments.filter((doc) => doc.document_type === "assessment" && !doc.diagnosis_codes?.length).length,
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
                Documentation Center
              </h1>
              <p className="text-muted-foreground">Manage clinical documentation, assessments, and treatment plans</p>
            </div>
            <CreateDocumentDialog providerId={provider.id} patients={patients || []}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Document
              </Button>
            </CreateDocumentDialog>
          </div>

          <DocumentationOverview stats={documentStats} />

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="assessments">Assessments</TabsTrigger>
              <TabsTrigger value="progress-notes">Progress Notes</TabsTrigger>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <DocumentList documents={recentDocuments} currentProviderId={provider.id} patients={patients || []} />
            </TabsContent>

            <TabsContent value="assessments" className="space-y-4">
              <DocumentList
                documents={recentDocuments.filter((doc) => doc.document_type === "assessment")}
                currentProviderId={provider.id}
                patients={patients || []}
              />
            </TabsContent>

            <TabsContent value="progress-notes" className="space-y-4">
              <DocumentList
                documents={recentDocuments.filter((doc) => doc.document_type === "progress_note")}
                currentProviderId={provider.id}
                patients={patients || []}
              />
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <DocumentList
                documents={recentDocuments.filter(
                  (doc) => doc.document_type === "assessment" && !doc.diagnosis_codes?.length,
                )}
                currentProviderId={provider.id}
                patients={patients || []}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
