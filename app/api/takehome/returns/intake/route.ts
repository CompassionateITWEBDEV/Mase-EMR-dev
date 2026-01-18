import { createServiceClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Get recent returns from inventory_txn
    const { data: returns, error } = await supabase
      .from("inventory_txn")
      .select("*")
      .eq("type", "return")
      .order("at_time", { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ returns: returns || [] })
  } catch (error) {
    console.error("[v0] Error fetching returns:", error)
    return NextResponse.json({ returns: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bottle_uid, seal_intact, residue_ml_est, notes, outcome } = body

    if (!bottle_uid) {
      return NextResponse.json({ error: "Bottle UID is required" }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Log the return in inventory_txn
    const { data: txn, error: txnError } = await supabase
      .from("inventory_txn")
      .insert({
        type: "return",
        reason: `Bottle return: ${outcome}. Seal intact: ${seal_intact}. Residue: ${residue_ml_est}ml. ${notes || ""}`,
        qty_ml: residue_ml_est || 0,
        by_user: "System",
        at_time: new Date().toISOString(),
      })
      .select()
      .single()

    if (txnError) throw txnError

    // Log in audit trail
    await supabase.from("audit_trail").insert({
      table_name: "takehome_returns",
      action: "return_intake",
      new_values: { bottle_uid, seal_intact, residue_ml_est, notes, outcome },
      timestamp: new Date().toISOString(),
    })

    // If outcome is concerning, create a dosing hold
    if (outcome === "tampered" || outcome === "missing") {
      await supabase.from("dosing_holds").insert({
        hold_type: outcome === "tampered" ? "suspected_diversion" : "missing_doses",
        reason: `Return inspection concern: ${outcome}. ${notes || ""}`,
        severity: "high",
        status: "active",
        created_by: "System",
        requires_clearance_from: ["counselor", "physician"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      return: txn,
      compliance_action: outcome !== "ok" ? "hold_created" : "none",
    })
  } catch (error) {
    console.error("[v0] Error processing return:", error)
    return NextResponse.json({ error: "Failed to process return" }, { status: 500 })
  }
}
