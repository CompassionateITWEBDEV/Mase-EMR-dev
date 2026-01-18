import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { reason } = body

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("prescriptions")
      .update({
        status: "cancelled",
        notes: reason ? `Cancelled: ${reason}` : "Cancelled by provider",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error cancelling prescription:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error cancelling prescription:", error)
    return NextResponse.json({ error: "Failed to cancel prescription" }, { status: 500 })
  }
}
