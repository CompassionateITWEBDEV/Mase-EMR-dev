"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DischargeSummaryForm } from "@/components/discharge-summary-form"

export default function EditDischargeSummaryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [summary, setSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadSummary = useCallback(async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("discharge_summaries")
        .select(
          `
          *,
          patients!discharge_summaries_patient_id_fkey(
            id,
            first_name,
            last_name
          ),
          providers!discharge_summaries_provider_id_fkey(
            id,
            first_name,
            last_name
          )
        `,
        )
        .eq("id", params.id)
        .single()

      if (error) throw error
      setSummary(data)
    } catch (error) {
      console.error("Error loading discharge summary:", error)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="text-center py-12">Loading discharge summary...</div>
          </main>
        </div>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6">
          <DischargeSummaryForm existingSummary={summary} isEditing={true} />
        </main>
      </div>
    </div>
  )
}
