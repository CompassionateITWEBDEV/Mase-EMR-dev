import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { reason, cancelled_by } = body
    const now = new Date().toISOString()

    const supabase = createServiceClient()

    // Get current prescription to check if it was sent
    const { data: prescription } = await supabase
      .from("prescriptions")
      .select("status")
      .eq("id", id)
      .single()

    // If the prescription was already sent, create a cancel transmission entry
    if (prescription?.status === "sent") {
      await supabase.from("e_prescribing_transmissions").insert({
        prescription_id: id,
        transmission_type: "cancel_rx",
        status: "pending",
        retry_count: 0,
        request_payload: {
          prescription_id: id,
          reason: reason || "Cancelled by provider",
          cancelled_by: cancelled_by || null,
          timestamp: now,
        },
        transmitted_at: now,
        created_at: now,
      })
    }

    const { data, error } = await supabase
      .from("prescriptions")
      .update({
        status: "cancelled",
        cancelled_reason: reason || "Cancelled by provider",
        cancelled_by: cancelled_by || null,
        cancelled_at: now,
        updated_at: now,
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
