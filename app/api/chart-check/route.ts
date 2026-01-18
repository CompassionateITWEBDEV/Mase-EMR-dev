import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")
    const status = searchParams.get("status")

    let query = supabase.from("patient_chart_requirements").select(`
        *,
        patients(id, first_name, last_name, patient_number),
        required_chart_items(item_name, description, item_type)
      `)

    if (patientId) {
      query = query.eq("patient_id", patientId)
    }
    if (status) {
      query = query.eq("status", status)
    } else {
      query = query.in("status", ["pending", "overdue"])
    }

    const { data, error } = await query.order("due_date", { ascending: true })

    if (error) throw error

    // Update status for overdue items
    const today = new Date().toISOString().split("T")[0]
    const overdueIds = data?.filter((item) => item.status === "pending" && item.due_date < today).map((i) => i.id)

    if (overdueIds && overdueIds.length > 0) {
      await supabase.from("patient_chart_requirements").update({ status: "overdue" }).in("id", overdueIds)
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error fetching chart requirements:", error)
    return NextResponse.json({ error: "Failed to fetch chart requirements" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { action, requirementId, completedBy, documentReference } = body

    if (action === "complete") {
      const { data, error } = await supabase
        .from("patient_chart_requirements")
        .update({
          completed: true,
          completed_date: new Date().toISOString(),
          completed_by: completedBy,
          document_reference: documentReference,
          status: "completed",
        })
        .eq("id", requirementId)
        .select()

      if (error) throw error
      return NextResponse.json(data[0])
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error updating chart requirement:", error)
    return NextResponse.json({ error: "Failed to update requirement" }, { status: 500 })
  }
}
