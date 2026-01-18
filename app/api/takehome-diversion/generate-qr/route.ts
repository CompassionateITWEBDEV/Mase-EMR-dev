import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { createHash, randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      patient_id,
      organization_id,
      takehome_authorization_id,
      medication_name,
      dose_amount,
      number_of_bottles,
      start_date,
      dispensed_by,
      dispensing_location,
    } = body

    // Generate QR codes for each bottle
    const bottles = []
    const startDateObj = new Date(start_date)

    for (let i = 0; i < number_of_bottles; i++) {
      const scheduledDate = new Date(startDateObj)
      scheduledDate.setDate(scheduledDate.getDate() + i)

      // Generate unique QR code data
      const qrData = {
        pid: patient_id,
        bn: i + 1,
        med: medication_name,
        dose: dose_amount,
        date: scheduledDate.toISOString().split("T")[0],
        nonce: randomBytes(16).toString("hex"),
        ts: Date.now(),
      }

      const qrCodeData = Buffer.from(JSON.stringify(qrData)).toString("base64")
      const qrCodeHash = createHash("sha256").update(qrCodeData).digest("hex")

      const bottle = {
        patient_id,
        organization_id,
        takehome_authorization_id,
        bottle_number: i + 1,
        qr_code_data: qrCodeData,
        qr_code_hash: qrCodeHash,
        medication_name,
        dose_amount,
        scheduled_consumption_date: scheduledDate.toISOString().split("T")[0],
        dispensed_by,
        dispensed_at: new Date().toISOString(),
        dispensing_location_lat: dispensing_location?.latitude,
        dispensing_location_lng: dispensing_location?.longitude,
        dispensing_gps_accuracy: dispensing_location?.accuracy,
        status: "dispensed",
        compliance_status: "pending",
      }

      bottles.push(bottle)
    }

    // Insert all bottles
    const { data: insertedBottles, error } = await supabase.from("takehome_bottle_qr").insert(bottles).select()

    if (error) throw error

    // Log dispensing scan for each bottle
    const scanLogs = insertedBottles.map((bottle: any) => ({
      bottle_qr_id: bottle.id,
      patient_id,
      organization_id,
      scan_type: "dispensing",
      gps_latitude: dispensing_location?.latitude,
      gps_longitude: dispensing_location?.longitude,
      gps_accuracy_meters: dispensing_location?.accuracy,
      verification_passed: true,
    }))

    await supabase.from("takehome_scan_log").insert(scanLogs)

    return NextResponse.json({
      success: true,
      bottles: insertedBottles.map((b: any) => ({
        id: b.id,
        bottle_number: b.bottle_number,
        qr_code_data: b.qr_code_data,
        scheduled_date: b.scheduled_consumption_date,
      })),
      message: `${number_of_bottles} QR codes generated successfully`,
    })
  } catch (error) {
    console.error("Error generating QR codes:", error)
    return NextResponse.json({ error: "Failed to generate QR codes" }, { status: 500 })
  }
}
