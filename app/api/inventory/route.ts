import { createServiceClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch inventory batches from bottle and lot_batch tables
    const { data: bottles, error: bottlesError } = await supabase
      .from("bottle")
      .select(`
        *,
        lot_batch:lot_id (
          *,
          medication:medication_id (*)
        )
      `)
      .order("created_at", { ascending: false })

    if (bottlesError) throw bottlesError

    // Fetch inventory transactions
    const { data: transactions, error: txnError } = await supabase
      .from("inventory_txn")
      .select("*")
      .order("at_time", { ascending: false })
      .limit(50)

    if (txnError) throw txnError

    // Fetch DEA Form 222 records
    const { data: form222s, error: form222Error } = await supabase
      .from("dea_form_222")
      .select(`
        *,
        lines:dea_form_222_line (*)
      `)
      .order("created_at", { ascending: false })

    if (form222Error) throw form222Error

    // Fetch shift counts
    const { data: shiftCounts, error: shiftError } = await supabase
      .from("shift_count")
      .select("*")
      .order("date", { ascending: false })
      .limit(30)

    if (shiftError) throw shiftError

    // Calculate metrics
    const totalStock = bottles?.reduce((sum, b) => sum + (b.current_volume_ml || 0), 0) || 0
    const pendingForm222 = form222s?.filter((f) => f.status === "pending" || f.status === "submitted").length || 0
    const expiredBatches =
      bottles?.filter((b) => {
        const lot = b.lot_batch
        if (!lot?.exp_date) return false
        return new Date(lot.exp_date) < new Date()
      }).length || 0

    // Calculate last biennial inventory date
    const lastBiennial = shiftCounts?.find((s) => s.notes?.toLowerCase().includes("biennial"))
    const daysSinceBiennial = lastBiennial
      ? Math.floor((Date.now() - new Date(lastBiennial.date).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Calculate variance
    const recentShift = shiftCounts?.[0]
    const variancePercent =
      recentShift && recentShift.closing_ml > 0
        ? Math.abs(((recentShift.variance_ml || 0) / recentShift.closing_ml) * 100)
        : 0

    return NextResponse.json({
      inventory:
        bottles?.map((b) => ({
          id: b.id,
          serialNo: b.serial_no,
          batchNumber: b.lot_batch?.lot || "Unknown",
          concentration: b.lot_batch?.medication?.conc_mg_per_ml || 10,
          quantity: b.current_volume_ml || 0,
          startVolume: b.start_volume_ml || 0,
          unit: "mL",
          expirationDate: b.lot_batch?.exp_date || null,
          manufacturer: b.lot_batch?.manufacturer || "Unknown",
          status: b.status || "active",
          location: `Vault ${b.id}`,
          openedAt: b.opened_at,
          medicationName: b.lot_batch?.medication?.name || "Methadone HCl",
        })) || [],
      transactions: transactions || [],
      form222s: form222s || [],
      shiftCounts: shiftCounts || [],
      metrics: {
        totalStock,
        pendingForm222,
        expiredBatches,
        daysSinceBiennial,
        variancePercent: variancePercent.toFixed(2),
      },
    })
  } catch (error) {
    console.error("Error fetching inventory:", error)
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { action, data } = body

    if (action === "record_acquisition") {
      // Create Form 222 record
      const { data: form222, error: formError } = await supabase
        .from("dea_form_222")
        .insert({
          form_number: data.formNumber,
          supplier_name: data.supplierName,
          supplier_dea_number: data.supplierDea,
          registrant_name: data.registrantName,
          registrant_dea_number: data.registrantDea,
          execution_date: data.executionDate,
          status: "pending",
        })
        .select()
        .single()

      if (formError) throw formError
      return NextResponse.json({ success: true, form222 })
    }

    if (action === "record_disposal") {
      // Record disposal transaction
      const { error: txnError } = await supabase.from("inventory_txn").insert({
        bottle_id: data.bottleId,
        type: "disposal",
        qty_ml: -data.quantity,
        reason: data.reason,
        by_user: data.user,
      })

      if (txnError) throw txnError

      // Update bottle status if fully disposed
      if (data.fullDisposal) {
        await supabase.from("bottle").update({ status: "disposed", current_volume_ml: 0 }).eq("id", data.bottleId)
      }

      return NextResponse.json({ success: true })
    }

    if (action === "initial_inventory" || action === "biennial_inventory") {
      // Record inventory snapshot as a shift count
      const { error: countError } = await supabase.from("shift_count").insert({
        date: new Date().toISOString().split("T")[0],
        shift: action === "initial_inventory" ? "Initial" : "Biennial",
        opening_ml: data.openingCount,
        physical_count_ml: data.physicalCount,
        closing_ml: data.physicalCount,
        variance_ml: data.variance || 0,
        by_user: data.countedBy,
        verified_by: data.verifiedBy,
        notes: `${action === "initial_inventory" ? "Initial" : "Biennial"} inventory - ${data.notes || ""}`,
      })

      if (countError) throw countError
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Error processing inventory action:", error)
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 })
  }
}
