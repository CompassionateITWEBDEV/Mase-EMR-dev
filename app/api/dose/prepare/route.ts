import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { patient_id, requested_mg } = await request.json()

    if (!patient_id || typeof requested_mg !== "number") {
      return NextResponse.json({ error: "Missing dose preparation data" }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const activeOrder = await getActiveMedicationOrder(supabase, patient_id)
    if (!activeOrder) {
      return NextResponse.json({ error: "No active order found" }, { status: 404 })
    }

    if (requested_mg > Number(activeOrder.daily_dose_mg)) {
      return NextResponse.json({ error: "Requested dose exceeds daily limit" }, { status: 400 })
    }

    const activeBottle = await getActiveBottle(supabase)
    if (!activeBottle) {
      return NextResponse.json({ error: "No active bottle available" }, { status: 503 })
    }

    const medication = await getMedicationForBottle(supabase, activeBottle.lot_id)
    if (!medication) {
      return NextResponse.json({ error: "Medication configuration missing" }, { status: 500 })
    }

    const computed_ml = requested_mg / Number(medication.conc_mg_per_ml)

    if (Number(activeBottle.current_volume_ml) < computed_ml) {
      return NextResponse.json(
        {
          error: "Insufficient volume in bottle",
          available_ml: Number(activeBottle.current_volume_ml),
          required_ml: computed_ml,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      computed_ml,
      bottle_id: activeBottle.id,
      available_ml: Number(activeBottle.current_volume_ml),
      medication_name: medication.name,
      concentration: Number(medication.conc_mg_per_ml),
      order_id: activeOrder.id,
    })
  } catch (error) {
    console.error("[dose] preparation error", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function getActiveMedicationOrder(supabase: any, patientId: number) {
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("medication_order")
    .select("id, daily_dose_mg, max_takehome, start_date, stop_date, status")
    .eq("patient_id", patientId)
    .eq("status", "active")
    .lte("start_date", today)
    .or(`stop_date.is.null,stop_date.gte.${today}`)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[dose] active order query failed", error)
  }

  return data
}

async function getActiveBottle(supabase: any) {
  const { data, error } = await supabase
    .from("bottle")
    .select("id, current_volume_ml, lot_id")
    .eq("status", "active")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[dose] active bottle query failed", error)
  }

  return data
}

async function getMedicationForBottle(supabase: any, lotId: number | null) {
  if (!lotId) return null

  const { data: lot, error: lotError } = await supabase
    .from("lot_batch")
    .select("id, medication_id")
    .eq("id", lotId)
    .single()

  if (lotError || !lot) {
    console.error("[dose] lot lookup failed", lotError)
    return null
  }

  const { data: medication, error: medicationError } = await supabase
    .from("medication")
    .select("id, name, conc_mg_per_ml")
    .eq("id", lot.medication_id)
    .single()

  if (medicationError) {
    console.error("[dose] medication lookup failed", medicationError)
    return null
  }

  return medication
}
