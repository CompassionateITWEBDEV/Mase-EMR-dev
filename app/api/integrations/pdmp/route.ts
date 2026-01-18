import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

type PdmpPrescription = {
  medication_name: string
  dea_schedule: string
  ndc_code: string
  quantity: number
  days_supply: number
  prescriber_name: string
  prescriber_npi: string
  prescriber_dea: string
  pharmacy_name: string
  pharmacy_npi: string
  fill_date: string
  written_date: string
  morphine_equivalent_dose: number
}

const buildPdmpReport = (patientId: string) => {
  const today = new Date()
  const isoDate = today.toISOString().slice(0, 10)
  const prescriptions: PdmpPrescription[] = [
    {
      medication_name: "Oxycodone",
      dea_schedule: "II",
      ndc_code: "00093-7181",
      quantity: 30,
      days_supply: 7,
      prescriber_name: "Dr. Angela Kim",
      prescriber_npi: "1234567890",
      prescriber_dea: "AK1234567",
      pharmacy_name: "Community Health Pharmacy",
      pharmacy_npi: "1093827465",
      fill_date: isoDate,
      written_date: isoDate,
      morphine_equivalent_dose: 60,
    },
    {
      medication_name: "Hydrocodone/APAP",
      dea_schedule: "II",
      ndc_code: "00378-5421",
      quantity: 20,
      days_supply: 5,
      prescriber_name: "Dr. Matthew Patel",
      prescriber_npi: "9876543210",
      prescriber_dea: "MP7654321",
      pharmacy_name: "Wellness Pharmacy",
      pharmacy_npi: "1029384756",
      fill_date: isoDate,
      written_date: isoDate,
      morphine_equivalent_dose: 45,
    },
  ]

  return {
    patient_id: patientId,
    report_generated_at: today.toISOString(),
    prescriptions,
    summary: {
      total_prescriptions: prescriptions.length,
      total_mme: prescriptions.reduce((total, rx) => total + rx.morphine_equivalent_dose, 0),
      unique_prescribers: new Set(prescriptions.map((rx) => rx.prescriber_npi)).size,
      unique_pharmacies: new Set(prescriptions.map((rx) => rx.pharmacy_npi)).size,
    },
  }
}

const buildRedFlags = (prescriptions: PdmpPrescription[]) => {
  const totalMme = prescriptions.reduce((total, rx) => total + rx.morphine_equivalent_dose, 0)
  const prescriberCount = new Set(prescriptions.map((rx) => rx.prescriber_npi)).size
  const pharmacyCount = new Set(prescriptions.map((rx) => rx.pharmacy_npi)).size

  return {
    doctor_shopping: prescriberCount >= 2,
    overlapping_prescriptions: prescriptions.length > 1,
    high_mme: totalMme >= 90,
    multiple_pharmacies: pharmacyCount >= 2,
  }
}

const computeAlertLevel = (redFlags: Record<string, boolean>) => {
  const flagCount = Object.values(redFlags).filter(Boolean).length
  if (flagCount >= 3) return "critical"
  if (flagCount === 2) return "high"
  if (flagCount === 1) return "medium"
  return "none"
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ success: false, error: "Patient ID required" }, { status: 400 })
    }

    const requests = await sql`
      SELECT 
        pr.*,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        prov.first_name as provider_first_name,
        prov.last_name as provider_last_name,
        (SELECT COUNT(*) FROM pdmp_prescriptions WHERE pdmp_request_id = pr.id) as prescription_count
      FROM pdmp_requests pr
      LEFT JOIN patients p ON pr.patient_id = p.id
      LEFT JOIN providers prov ON pr.provider_id = prov.id
      WHERE pr.patient_id = ${patientId}
      ORDER BY pr.request_date DESC
    `

    return NextResponse.json({ success: true, requests })
  } catch (error: any) {
    console.error("[v0] Error fetching PDMP requests:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId, providerId, requestType, stateCode } = body

    if (!patientId || !providerId || !stateCode) {
      return NextResponse.json(
        { success: false, error: "patientId, providerId, and stateCode are required" },
        { status: 400 },
      )
    }

    // Create PDMP request
    const [pdmpRequest] = await sql`
      INSERT INTO pdmp_requests (
        patient_id,
        provider_id,
        request_type,
        request_status,
        state_requested
      ) VALUES (
        ${patientId},
        ${providerId},
        ${requestType || "routine"},
        'pending',
        ${stateCode}
      )
      RETURNING *
    `

    const report = buildPdmpReport(patientId)
    const redFlags = buildRedFlags(report.prescriptions)
    const alertLevel = computeAlertLevel(redFlags)

    const [updatedRequest] = await sql`
      UPDATE pdmp_requests
      SET request_status = 'completed',
        response_date = NOW(),
        pdmp_report = ${JSON.stringify(report)},
        red_flags = ${JSON.stringify(redFlags)},
        alert_level = ${alertLevel}
      WHERE id = ${pdmpRequest.id}
      RETURNING *
    `

    await Promise.all(
      report.prescriptions.map((prescription) => sql`
        INSERT INTO pdmp_prescriptions (
          pdmp_request_id,
          medication_name,
          dea_schedule,
          ndc_code,
          quantity,
          days_supply,
          prescriber_name,
          prescriber_npi,
          prescriber_dea,
          pharmacy_name,
          pharmacy_npi,
          fill_date,
          written_date,
          morphine_equivalent_dose
        ) VALUES (
          ${pdmpRequest.id},
          ${prescription.medication_name},
          ${prescription.dea_schedule},
          ${prescription.ndc_code},
          ${prescription.quantity},
          ${prescription.days_supply},
          ${prescription.prescriber_name},
          ${prescription.prescriber_npi},
          ${prescription.prescriber_dea},
          ${prescription.pharmacy_name},
          ${prescription.pharmacy_npi},
          ${prescription.fill_date},
          ${prescription.written_date},
          ${prescription.morphine_equivalent_dose}
        )
      `),
    )

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: "PDMP request submitted",
      redFlags,
      alertLevel,
      pdmpReport: report,
    })
  } catch (error: any) {
    console.error("[v0] Error creating PDMP request:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
