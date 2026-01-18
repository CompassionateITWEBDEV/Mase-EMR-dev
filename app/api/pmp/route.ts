import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get PDMP requests for today
    const { data: todayChecks } = await supabase
      .from("pdmp_requests")
      .select("*")
      .gte("request_date", today.toISOString())
      .lt("request_date", tomorrow.toISOString())

    // Get yesterday's checks for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const { data: yesterdayChecks } = await supabase
      .from("pdmp_requests")
      .select("*")
      .gte("request_date", yesterday.toISOString())
      .lt("request_date", today.toISOString())

    // Get high-risk alerts from PDMP requests
    const { data: highRiskRequests } = await supabase
      .from("pdmp_requests")
      .select(`
        *,
        patients:patient_id (first_name, last_name, date_of_birth)
      `)
      .in("alert_level", ["critical", "high"])
      .is("reviewed_at", null)
      .order("request_date", { ascending: false })
      .limit(10)

    // Get patients with controlled substance prescriptions
    const { data: controlledRx } = await supabase
      .from("patient_medications")
      .select("patient_id")
      .or("medication_type.eq.controlled,medication_type.eq.opioid,medication_type.eq.benzodiazepine")
      .eq("status", "active")

    const uniquePatients = new Set(controlledRx?.map((r) => r.patient_id) || [])

    const recentAlerts = (highRiskRequests || []).map((request) => ({
      id: request.id,
      patientName: request.patients
        ? `${request.patients.first_name} ${request.patients.last_name}`
        : "Unknown Patient",
      dob: request.patients?.date_of_birth || "",
      alertType: "pmp_high_risk",
      severity: request.alert_level || "medium",
      message: request.red_flags
        ? `Red flags: ${Object.keys(request.red_flags).join(", ")}`
        : "High-risk prescription pattern detected",
      createdAt: request.request_date,
    }))

    return NextResponse.json({
      systemStatus: "online",
      todayChecks: todayChecks?.length || 0,
      yesterdayChecks: yesterdayChecks?.length || 0,
      highRiskAlerts: highRiskRequests?.length || 0,
      recentAlerts,
      controlledSubstancePatients: uniquePatients.size,
    })
  } catch (error) {
    console.error("Error in PMP API:", error)
    return NextResponse.json({
      systemStatus: "offline",
      todayChecks: 0,
      yesterdayChecks: 0,
      highRiskAlerts: 0,
      recentAlerts: [],
      controlledSubstancePatients: 0,
    })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    // Get PDMP configuration
    const { data: config, error: configError } = await supabase
      .from("pdmp_config")
      .select("*")
      .maybeSingle()

    if (configError) {
      console.error("[v0] Error fetching PDMP config:", configError)
      return NextResponse.json(
        {
          success: false,
          error: "PMP is not configured. Please configure your PMP credentials first.",
        },
        { status: 400 },
      )
    }

    if (!config || !config.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "PMP is not configured. Please configure your PMP credentials first.",
        },
        { status: 400 },
      )
    }

    // Determine patient info
    const patientId = body.patientId
    let firstName = body.firstName
    let lastName = body.lastName
    let dob = body.dob

    // If patient ID provided, get their info
    if (patientId) {
      const { data: patient } = await supabase
        .from("patients")
        .select("first_name, last_name, date_of_birth")
        .eq("id", patientId)
        .single()

      if (patient) {
        firstName = patient.first_name
        lastName = patient.last_name
        dob = patient.date_of_birth
      }
    }

    // In production, this would make an actual API call to the state PMP
    // For now, we simulate a response and store in the database

    // Generate simulated PMP response
    const simulatedPrescriptions = generateSimulatedPrescriptions()
    const redFlags = analyzeForRedFlags(simulatedPrescriptions)
    const alertLevel = determineAlertLevel(redFlags)

    // Create PDMP request record
    const { data: pdmpRequest, error: requestError } = await supabase
      .from("pdmp_requests")
      .insert({
        patient_id: patientId || null,
        request_type: "patient_lookup",
        request_status: "completed",
        state_requested: config.state_code || "MI",
        request_date: new Date().toISOString(),
        response_date: new Date().toISOString(),
        pdmp_report: { prescriptions: simulatedPrescriptions },
        alert_level: alertLevel,
        red_flags: redFlags,
        notes: `Query for ${firstName} ${lastName}`,
      })
      .select()
      .single()

    if (requestError) {
      console.error("Error creating PDMP request:", requestError)
      throw requestError
    }

    // Store prescriptions if any
    if (simulatedPrescriptions.length > 0 && pdmpRequest) {
      const prescriptionRecords = simulatedPrescriptions.map((rx) => ({
        pdmp_request_id: pdmpRequest.id,
        medication_name: rx.medication_name,
        fill_date: rx.fill_date,
        quantity: rx.quantity,
        days_supply: rx.days_supply,
        prescriber_name: rx.prescriber_name,
        prescriber_npi: rx.prescriber_npi,
        pharmacy_name: rx.pharmacy_name,
        pharmacy_npi: rx.pharmacy_npi,
        dea_schedule: rx.dea_schedule,
        morphine_equivalent_dose: rx.morphine_equivalent_dose,
      }))

      await supabase.from("pdmp_prescriptions").insert(prescriptionRecords)
    }

    // Log to audit trail
    await supabase.from("audit_trail").insert({
      table_name: "pdmp_requests",
      action: "pmp_lookup",
      record_id: pdmpRequest?.id,
      new_values: {
        firstName,
        lastName,
        dob,
        state: config.state_code,
        searchedAt: new Date().toISOString(),
        alertLevel,
      },
    })

    // If high risk, create clinical alert
    if (alertLevel === "critical" || alertLevel === "high") {
      await supabase.from("clinical_alerts").insert({
        patient_id: patientId || null,
        alert_type: "pmp_high_risk",
        severity: alertLevel,
        alert_message: `PMP check returned ${alertLevel} risk level. Red flags: ${Object.keys(redFlags).join(", ")}`,
        status: "open",
        triggered_by: "pmp_system",
      })
    }

    return NextResponse.json({
      success: true,
      requestId: pdmpRequest?.id,
      searchParams: { firstName, lastName, dob },
      prescriptionCount: simulatedPrescriptions.length,
      prescriptions: simulatedPrescriptions,
      alertLevel,
      redFlags: Object.keys(redFlags).length > 0 ? Object.entries(redFlags).map(([k, v]) => `${k}: ${v}`) : [],
    })
  } catch (error) {
    console.error("Error in PMP POST:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Helper functions for simulation
function generateSimulatedPrescriptions() {
  // Simulate 0-5 controlled substance prescriptions
  const count = Math.floor(Math.random() * 6)
  const prescriptions = []

  const medications = [
    { name: "Hydrocodone/APAP 10/325mg", schedule: "C-II", mme: 15 },
    { name: "Oxycodone 30mg", schedule: "C-II", mme: 45 },
    { name: "Alprazolam 2mg", schedule: "C-IV", mme: 0 },
    { name: "Clonazepam 1mg", schedule: "C-IV", mme: 0 },
    { name: "Methadone 10mg", schedule: "C-II", mme: 40 },
    { name: "Buprenorphine/Naloxone 8/2mg", schedule: "C-III", mme: 0 },
    { name: "Gabapentin 300mg", schedule: "C-V", mme: 0 },
    { name: "Tramadol 50mg", schedule: "C-IV", mme: 5 },
  ]

  const prescribers = [
    { name: "Dr. John Smith", npi: "1234567890" },
    { name: "Dr. Sarah Johnson", npi: "2345678901" },
    { name: "Dr. Michael Brown", npi: "3456789012" },
    { name: "Dr. Emily Davis", npi: "4567890123" },
  ]

  const pharmacies = [
    { name: "CVS Pharmacy #1234", npi: "5678901234" },
    { name: "Walgreens #5678", npi: "6789012345" },
    { name: "Rite Aid #9012", npi: "7890123456" },
    { name: "Meijer Pharmacy", npi: "8901234567" },
  ]

  for (let i = 0; i < count; i++) {
    const med = medications[Math.floor(Math.random() * medications.length)]
    const prescriber = prescribers[Math.floor(Math.random() * prescribers.length)]
    const pharmacy = pharmacies[Math.floor(Math.random() * pharmacies.length)]

    const daysAgo = Math.floor(Math.random() * 365)
    const fillDate = new Date()
    fillDate.setDate(fillDate.getDate() - daysAgo)

    prescriptions.push({
      medication_name: med.name,
      dea_schedule: med.schedule,
      fill_date: fillDate.toISOString().split("T")[0],
      quantity: Math.floor(Math.random() * 90) + 30,
      days_supply: Math.floor(Math.random() * 30) + 7,
      prescriber_name: prescriber.name,
      prescriber_npi: prescriber.npi,
      pharmacy_name: pharmacy.name,
      pharmacy_npi: pharmacy.npi,
      morphine_equivalent_dose: med.mme * (Math.floor(Math.random() * 3) + 1),
    })
  }

  return prescriptions
}

function analyzeForRedFlags(prescriptions: any[]) {
  const redFlags: Record<string, any> = {}

  if (prescriptions.length === 0) return redFlags

  // Check for multiple prescribers
  const prescribers = new Set(prescriptions.map((p) => p.prescriber_npi))
  if (prescribers.size >= 3) {
    redFlags["multiple_prescribers"] = `${prescribers.size} different prescribers in 12 months`
  }

  // Check for multiple pharmacies
  const pharmacies = new Set(prescriptions.map((p) => p.pharmacy_npi))
  if (pharmacies.size >= 3) {
    redFlags["multiple_pharmacies"] = `${pharmacies.size} different pharmacies in 12 months`
  }

  // Check for high MME
  const totalMME = prescriptions.reduce((sum, p) => sum + (p.morphine_equivalent_dose || 0), 0)
  if (totalMME > 90) {
    redFlags["high_mme"] = `Total MME: ${totalMME} mg/day`
  }

  // Check for concurrent opioid + benzodiazepine
  const hasOpioid = prescriptions.some((p) => p.dea_schedule === "C-II")
  const hasBenzo = prescriptions.some(
    (p) =>
      p.medication_name.toLowerCase().includes("alprazolam") ||
      p.medication_name.toLowerCase().includes("clonazepam") ||
      p.medication_name.toLowerCase().includes("diazepam"),
  )
  if (hasOpioid && hasBenzo) {
    redFlags["concurrent_opioid_benzo"] = "Concurrent opioid and benzodiazepine prescriptions"
  }

  // Check for early refills
  const recentRx = prescriptions.filter((p) => {
    const fillDate = new Date(p.fill_date)
    const daysAgo = Math.floor((Date.now() - fillDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysAgo < 30
  })
  if (recentRx.length > 3) {
    redFlags["frequent_fills"] = `${recentRx.length} prescriptions filled in last 30 days`
  }

  return redFlags
}

function determineAlertLevel(redFlags: Record<string, any>): string {
  const flagCount = Object.keys(redFlags).length

  if (redFlags["concurrent_opioid_benzo"] || redFlags["high_mme"]) {
    return "critical"
  }
  if (flagCount >= 2) {
    return "high"
  }
  if (flagCount === 1) {
    return "medium"
  }
  return "low"
}
