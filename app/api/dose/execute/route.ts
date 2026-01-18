import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { createHash } from "crypto"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { patient_id, ml, witness_signature } = await request.json()

    if (!patient_id || typeof ml !== "number" || !witness_signature) {
      return NextResponse.json({ error: "Missing dispense parameters" }, { status: 400 })
    }

    const supabase = await createServiceRoleClient()

    const [device, order, bottle, patient] = await Promise.all([
      getActiveDevice(supabase),
      getActiveMedicationOrder(supabase, patient_id),
      getActiveBottle(supabase),
      getPatientDetails(supabase, patient_id),
    ])

    const medication = await getMedicationForBottle(supabase, bottle?.lot_id ?? null)

    if (!device || device.status !== "online") {
      return NextResponse.json({ error: "Dispensing device offline" }, { status: 503 })
    }

    if (!order) {
      return NextResponse.json({ error: "No active order" }, { status: 404 })
    }

    if (!bottle || !medication) {
      return NextResponse.json({ error: "Active bottle unavailable" }, { status: 503 })
    }

    const concentration = Number(medication.conc_mg_per_ml)
    const requestedMg = ml * concentration

    if (requestedMg > Number(order.daily_dose_mg)) {
      return NextResponse.json({ error: "Requested volume exceeds order limits" }, { status: 400 })
    }

    if (Number(bottle.current_volume_ml) < ml) {
      return NextResponse.json({ error: "Insufficient volume in active bottle" }, { status: 400 })
    }

    const signature_hash = createHash("sha256").update(witness_signature).digest("hex")
    const now = new Date().toISOString()

    const { data: doseEvent, error: doseError } = await supabase
      .from("dose_event")
      .insert({
        patient_id,
        order_id: order.id,
        requested_mg: requestedMg,
        dispensed_mg: requestedMg,
        dispensed_ml: ml,
        bottle_id: bottle.id,
        device_id: device.id,
        by_user: "dispensing_api",
        outcome: "success",
        signature_hash,
        notes: "Automated dispense",
      })
      .select("id")
      .single()

    if (doseError || !doseEvent) {
      console.error("[dose] failed to record event", doseError)
      return NextResponse.json({ error: "Failed to record dose" }, { status: 500 })
    }

    const newVolume = Number(bottle.current_volume_ml) - ml

    const { error: bottleError } = await supabase
      .from("bottle")
      .update({ current_volume_ml: newVolume, updated_at: now })
      .eq("id", bottle.id)

    if (bottleError) {
      console.error("[dose] failed to update bottle", bottleError)
    }

    await supabase.from("inventory_txn").insert({
      bottle_id: bottle.id,
      type: "dose",
      qty_ml: -ml,
      reason: `Patient dose - ${patient?.name ?? patient_id}`,
      by_user: "dispensing_api",
      dose_event_id: doseEvent.id,
      at_time: now,
    })

    await supabase.from("dispensing_logs").insert({
      dose_event_id: doseEvent.id,
      drug_name: medication.name,
      dosage_form: "Oral Solution",
      quantity_ml: ml,
      quantity_units: null,
      patient_mrn: patient?.mrn ?? null,
      dispensed_at: now,
      staff_initials: deriveInitials(witness_signature),
      registered_location: "Main Treatment Center",
    })

    const deviceEvents = [
      {
        device_id: device.id,
        event_type: "dispense_start" as const,
        payload: { requested_ml: ml },
        at_time: now,
      },
      {
        device_id: device.id,
        event_type: "dispense_complete" as const,
        payload: { actual_ml: ml },
        at_time: now,
      },
    ]

    await supabase.from("device_event").insert(deviceEvents)

    return NextResponse.json({
      dose_event_id: doseEvent.id,
      actual_ml: ml,
      outcome: "success",
      device_events: deviceEvents.map(({ event_type, payload, at_time }) => ({
        event_type,
        payload,
        timestamp: at_time,
      })),
    })
  } catch (error) {
    console.error("[dose] execution error", error)
    return NextResponse.json({ error: "Dose execution failed" }, { status: 500 })
  }
}

async function getActiveDevice(supabase: any) {
  const { data } = await supabase
    .from("device")
    .select("id, status")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

async function getActiveMedicationOrder(supabase: any, patientId: number) {
  const today = new Date().toISOString().split("T")[0]
  const { data } = await supabase
    .from("medication_order")
    .select("id, daily_dose_mg")
    .eq("patient_id", patientId)
    .eq("status", "active")
    .lte("start_date", today)
    .or(`stop_date.is.null,stop_date.gte.${today}`)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

async function getActiveBottle(supabase: any) {
  const { data } = await supabase
    .from("bottle")
    .select("id, current_volume_ml, lot_id")
    .eq("status", "active")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

async function getMedicationForBottle(supabase: any, lotId: number | null) {
  if (!lotId) return null

  const { data: lot } = await supabase
    .from("lot_batch")
    .select("medication_id")
    .eq("id", lotId)
    .single()

  if (!lot) return null

  const { data: medication } = await supabase
    .from("medication")
    .select("id, name, conc_mg_per_ml")
    .eq("id", lot.medication_id)
    .single()

  return medication
}

async function getPatientDetails(supabase: any, patientId: number) {
  const { data } = await supabase
    .from("patient_dispensing")
    .select("id, name, mrn")
    .eq("id", patientId)
    .maybeSingle()

  return data
}

function deriveInitials(signature: string) {
  const parts = signature.split(/\s+/).filter(Boolean)
  return parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 10)
}
