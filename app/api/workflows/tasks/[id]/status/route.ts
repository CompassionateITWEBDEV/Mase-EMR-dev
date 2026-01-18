import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
    }

    const { data, error } = await supabase.from("workflow_tasks").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating task status:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating task status:", error)
    return NextResponse.json({ error: "Failed to update task status" }, { status: 500 })
  }
}
