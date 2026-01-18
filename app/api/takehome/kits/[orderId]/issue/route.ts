import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const supabase = createServiceClient()
    const { orderId } = await params

    // Update the order status to active
    const { error } = await supabase
      .from("medication_order")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error issuing kit:", error)
    return NextResponse.json({ error: "Failed to issue kit" }, { status: 500 })
  }
}
