import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Get patients with dual eligibility (Medicare + Medicaid)
    const { data: dualEligiblePatients, error: patientsError } = await supabase
      .from("patient_insurance")
      .select(`
        *,
        patients:patient_id (first_name, last_name, date_of_birth),
        payers:payer_id (payer_name, network_type)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (patientsError) {
      console.error("Error fetching dual eligible patients:", patientsError)
    }

    // Group by patient to find those with multiple insurance types
    const patientInsuranceMap = new Map()
    ;(dualEligiblePatients || []).forEach((ins) => {
      const patientId = ins.patient_id
      if (!patientInsuranceMap.has(patientId)) {
        patientInsuranceMap.set(patientId, {
          patient: ins.patients,
          insurances: [],
        })
      }
      patientInsuranceMap.get(patientId).insurances.push({
        payerName: ins.payers?.payer_name,
        networkType: ins.payers?.network_type,
        policyNumber: ins.policy_number,
        priority: ins.priority_order,
      })
    })

    // Filter for dual eligible (patients with both Medicare and Medicaid)
    const dualEligible = Array.from(patientInsuranceMap.values()).filter((p) => {
      const hasMedicare = p.insurances.some(
        (i: any) =>
          i.payerName?.toLowerCase().includes("medicare") || i.networkType?.toLowerCase().includes("medicare"),
      )
      const hasMedicaid = p.insurances.some(
        (i: any) =>
          i.payerName?.toLowerCase().includes("medicaid") || i.networkType?.toLowerCase().includes("medicaid"),
      )
      return hasMedicare && hasMedicaid
    })

    // Get pending claims for dual eligible patients
    const { data: pendingClaims, error: claimsError } = await supabase
      .from("insurance_claims")
      .select(`
        *,
        patients:patient_id (first_name, last_name),
        payers:payer_id (payer_name)
      `)
      .in("claim_status", ["pending", "submitted", "processing"])
      .order("submission_date", { ascending: false })
      .limit(20)

    if (claimsError) {
      console.error("Error fetching claims:", claimsError)
    }

    // Filter claims for dual eligible patients
    const dualEligiblePatientIds = dualEligible.map((p) => p.patient?.id).filter(Boolean)
    const dualEligibleClaims = (pendingClaims || []).filter((claim) =>
      dualEligiblePatientIds.includes(claim.patient_id),
    )

    return NextResponse.json({
      dualEligibleCount: dualEligible.length,
      dualEligiblePatients: dualEligible.map((p) => ({
        id: p.patient?.id,
        name: p.patient ? `${p.patient.first_name} ${p.patient.last_name}` : "Unknown",
        dob: p.patient?.date_of_birth,
        insurances: p.insurances,
      })),
      pendingClaims: dualEligibleClaims.map((claim) => ({
        id: claim.id,
        claimNumber: claim.claim_number,
        patientName: claim.patients ? `${claim.patients.first_name} ${claim.patients.last_name}` : "Unknown",
        payerName: claim.payers?.payer_name || "Unknown",
        status: claim.claim_status,
        totalCharges: claim.total_charges,
        submissionDate: claim.submission_date,
      })),
    })
  } catch (error) {
    console.error("Error in dual eligible API:", error)
    return NextResponse.json({
      dualEligibleCount: 0,
      dualEligiblePatients: [],
      pendingClaims: [],
    })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    // Process Medicare crossover
    if (body.action === "process_crossover") {
      const { claimId } = body

      // Update claim status
      const { error } = await supabase
        .from("insurance_claims")
        .update({
          claim_status: "crossover_pending",
          notes: `Medicare crossover initiated at ${new Date().toISOString()}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", claimId)

      if (error) {
        return NextResponse.json({ error: "Failed to process crossover" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Crossover processing initiated" })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Error in dual eligible POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
