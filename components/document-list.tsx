"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Calendar, User, Edit, Trash2, Eye } from "lucide-react"
import { EditDocumentDialog } from "./edit-document-dialog"
import { DeleteDocumentDialog } from "./delete-document-dialog"
import { ViewDocumentDialog } from "./view-document-dialog"

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

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface DocumentListProps {
  documents: Document[]
  currentProviderId: string
  patients: Patient[]
}

export function DocumentList({ documents, currentProviderId, patients }: DocumentListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const getDocumentTypeLabel = (doc: Document) => {
    if (doc.document_type === "assessment") {
      return doc.assessment_type || "Assessment"
    }
    return doc.note_type || "Progress Note"
  }

  const getDocumentStatus = (doc: Document) => {
    if (doc.document_type === "assessment") {
      return doc.diagnosis_codes?.length ? "Completed" : "Pending"
    }
    return doc.subjective ? "Completed" : "Draft"
  }

  const getDocumentPreview = (doc: Document) => {
    if (doc.document_type === "assessment") {
      return doc.chief_complaint || "No chief complaint recorded"
    }
    return doc.subjective || "No subjective notes recorded"
  }

  // Filter documents based on search and type
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      searchTerm === "" ||
      doc.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDocumentTypeLabel(doc).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "assessments" && doc.document_type === "assessment") ||
      (typeFilter === "progress-notes" && doc.document_type === "progress_note")

    return matchesSearch && matchesType
  })

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search documents, patients, or providers..."
            className="max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Document Types</SelectItem>
            <SelectItem value="assessments">Assessments</SelectItem>
            <SelectItem value="progress-notes">Progress Notes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Clinical Documents
            <Badge variant="secondary">{filteredDocuments.length} documents</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No documents found matching your criteria.</div>
            ) : (
              filteredDocuments.map((doc) => {
                const status = getDocumentStatus(doc)
                const preview = getDocumentPreview(doc)
                const docType = getDocumentTypeLabel(doc)

                return (
                  <div
                    key={doc.id}
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{docType}</h3>
                          <Badge
                            variant={
                              status === "Completed" ? "default" : status === "Pending" ? "secondary" : "outline"
                            }
                          >
                            {status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{doc.patient_name}</span>
                          </div>
                          <span>•</span>
                          <span>{doc.provider_name}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">{preview}</p>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <ViewDocumentDialog document={doc}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ViewDocumentDialog>

                        {doc.provider_id === currentProviderId && (
                          <>
                            <EditDocumentDialog document={doc} patients={patients}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </EditDocumentDialog>

                            <DeleteDocumentDialog
                              documentId={doc.id}
                              documentType={doc.document_type}
                              documentTitle={`${docType} for ${doc.patient_name}`}
                            >
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DeleteDocumentDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
