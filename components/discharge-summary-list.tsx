"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { FileOutput, Plus, Search, Eye, Edit, Download, Filter } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DischargeSummary {
  id: string
  patient_id: string
  patient_name: string
  admission_date: string
  discharge_date: string
  status: string
  provider_name: string
  discharge_disposition: string
  created_at: string
}

export function DischargeSummaryList() {
  const [summaries, setSummaries] = useState<DischargeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchSummaries()
  }, [])

  const fetchSummaries = async () => {
    try {
      const response = await fetch("/api/discharge-summary")
      if (response.ok) {
        const data = await response.json()
        setSummaries(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching discharge summaries:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSummaries = summaries.filter((summary) => {
    const matchesSearch =
      summary.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || summary.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "secondary"
      case "finalized":
        return "default"
      case "pending":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
            Discharge Summaries
          </h1>
          <p className="text-muted-foreground mt-1">Manage patient discharge documentation and aftercare plans</p>
        </div>
        <Link href="/discharge-summary/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Discharge Summary
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-[family-name:var(--font-work-sans)]">All Discharge Summaries</CardTitle>
              <CardDescription>View and manage patient discharge documentation</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="finalized">Finalized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading discharge summaries...</div>
          ) : filteredSummaries.length === 0 ? (
            <div className="text-center py-12">
              <FileOutput className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No discharge summaries found</p>
              <Link href="/discharge-summary/new">
                <Button className="mt-4 bg-transparent" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Discharge Summary
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSummaries.map((summary) => (
                <div
                  key={summary.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileOutput className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-medium text-foreground">{summary.patient_name || "Unknown Patient"}</p>
                        <Badge variant={getStatusColor(summary.status)}>{summary.status || "Draft"}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>ID: {summary.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>Admitted: {summary.admission_date || "N/A"}</span>
                        <span>•</span>
                        <span>Discharged: {summary.discharge_date || "N/A"}</span>
                        <span>•</span>
                        <span>Provider: {summary.provider_name || "Unassigned"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/discharge-summary/${summary.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/discharge-summary/${summary.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
