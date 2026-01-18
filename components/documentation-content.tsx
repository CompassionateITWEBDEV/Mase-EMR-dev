"use client"

import { useState, useEffect, useCallback } from "react"
import { DocumentationOverview } from "@/components/documentation-overview"
import { DocumentList } from "@/components/document-list"
import { CreateDocumentDialog } from "@/components/create-document-dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface Document {
  id: string
  document_type: "assessment" | "progress_note"
  patient_name: string
  provider_name: string
  created_at: string
  assessment_type?: string
  note_type?: string
  chief_complaint?: string
  subjective?: string
  diagnosis_codes?: string[]
  patient_id: string
  provider_id: string
}

interface DocumentStats {
  total: number
  assessments: number
  progressNotes: number
  pending: number
}

interface DocumentationContentProps {
  providerId: string
  patients: Patient[]
  preSelectedPatientId?: string
  autoOpen?: boolean
}

export function DocumentationContent({
  providerId,
  patients,
  preSelectedPatientId,
  autoOpen = false,
}: DocumentationContentProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    assessments: 0,
    progressNotes: 0,
    pending: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch documents from the API
  const fetchDocuments = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true)
    }

    try {
      const response = await fetch("/api/clinical-documents")
      const data = await response.json()

      if (data.success) {
        setDocuments(data.documents || [])
        setStats(data.stats || {
          total: 0,
          assessments: 0,
          progressNotes: 0,
          pending: 0,
        })
      } else {
        console.error("[DocumentationContent] Failed to fetch documents:", data.error)
        toast.error("Failed to load documents")
      }
    } catch (error) {
      console.error("[DocumentationContent] Error fetching documents:", error)
      toast.error("Failed to load documents")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Handle document created - refresh the list
  const handleDocumentCreated = useCallback(() => {
    console.log("[DocumentationContent] Document created, refreshing list...")
    fetchDocuments(true)
  }, [fetchDocuments])

  // Manual refresh
  const handleRefresh = useCallback(() => {
    fetchDocuments(true)
  }, [fetchDocuments])

  // Filter documents by type
  const assessments = documents.filter((doc) => doc.document_type === "assessment")
  const progressNotes = documents.filter((doc) => doc.document_type === "progress_note")
  const pendingDocuments = documents.filter(
    (doc) => doc.document_type === "assessment" && !doc.diagnosis_codes?.length
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading documents...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
            Documentation Center
          </h1>
          <p className="text-muted-foreground">Manage clinical documentation, assessments, and treatment plans</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <CreateDocumentDialog
            providerId={providerId}
            patients={patients}
            preSelectedPatientId={preSelectedPatientId}
            autoOpen={autoOpen}
            onDocumentCreated={handleDocumentCreated}
          >
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Document
            </Button>
          </CreateDocumentDialog>
        </div>
      </div>

      <DocumentationOverview stats={stats} />

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All Documents
            {stats.total > 0 && (
              <span className="ml-2 text-xs bg-primary/10 px-2 py-0.5 rounded-full">
                {stats.total}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="assessments">
            Assessments
            {stats.assessments > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {stats.assessments}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="progress-notes">
            Progress Notes
            {stats.progressNotes > 0 && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                {stats.progressNotes}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending Review
            {stats.pending > 0 && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                {stats.pending}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <DocumentList
            documents={documents}
            currentProviderId={providerId}
            patients={patients}
          />
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <DocumentList
            documents={assessments}
            currentProviderId={providerId}
            patients={patients}
          />
        </TabsContent>

        <TabsContent value="progress-notes" className="space-y-4">
          <DocumentList
            documents={progressNotes}
            currentProviderId={providerId}
            patients={patients}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <DocumentList
            documents={pendingDocuments}
            currentProviderId={providerId}
            patients={patients}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
