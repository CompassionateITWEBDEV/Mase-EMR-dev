import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { reconciled_medications, notes } = body

    const supabase = await createClient()

    // Update reconciliation session as completed
    const { data, error } = await supabase
      .from("medication_reconciliation_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        reconciled_medications: reconciled_medications || [],
        notes: notes || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error completing reconciliation:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error completing reconciliation:", error)
    return NextResponse.json({ error: "Failed to complete reconciliation" }, { status: 500 })
  }
}
