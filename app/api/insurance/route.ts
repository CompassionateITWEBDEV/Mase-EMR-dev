import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "overview"

    if (type === "payers") {
      // Fetch insurance payers
      const { data: payers, error } = await supabase
        .from("insurance_payers")
        .select("*")
        .order("payer_name", { ascending: true })

      if (error) throw error
      return NextResponse.json({ payers: payers || [] })
    }

    if (type === "patient-insurance") {
      // Fetch patient insurance with patient and payer info
      const { data: patientInsurance, error } = await supabase
        .from("patient_insurance")
        .select(`
          *,
          patients:patient_id (id, first_name, last_name),
          insurance_payers:payer_id (id, payer_name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return NextResponse.json({ patientInsurance: patientInsurance || [] })
    }

    if (type === "patients") {
      // Fetch patients for dropdown
      const { data: patients, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .order("last_name", { ascending: true })

      if (error) throw error
      return NextResponse.json({ patients: patients || [] })
    }

    if (type === "eligibility") {
      // Fetch eligibility requests
      const { data: requests, error } = await supabase
        .from("eligibility_requests")
        .select(`
          *,
          patients:patient_id (id, first_name, last_name),
          insurance_payers:payer_id (id, payer_name)
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      return NextResponse.json({ eligibilityRequests: requests || [] })
    }

    // Overview - get counts for metrics
    const [payersResult, patientInsuranceResult, eligibilityResult, claimsResult] = await Promise.all([
      supabase.from("insurance_payers").select("id, is_active").eq("is_active", true),
      supabase.from("patient_insurance").select("id, is_active").eq("is_active", true),
      supabase.from("eligibility_requests").select("id").gte("created_at", new Date().toISOString().split("T")[0]),
      supabase.from("prior_auth_requests_edi").select("id, auth_status").eq("auth_status", "pending"),
    ])

    // Get total patients with coverage
    const { count: patientsWithCoverage } = await supabase
      .from("patient_insurance")
      .select("patient_id", { count: "exact", head: true })
      .eq("is_active", true)

    const { count: totalPatients } = await supabase.from("patients").select("id", { count: "exact", head: true })

    const coverageRate =
      totalPatients && totalPatients > 0 ? (((patientsWithCoverage || 0) / totalPatients) * 100).toFixed(1) : "0"

    return NextResponse.json({
      metrics: {
        activePayers: payersResult.data?.length || 0,
        patientsWithCoverage: patientsWithCoverage || 0,
        coverageRate,
        todayEligibilityChecks: eligibilityResult.data?.length || 0,
        pendingPriorAuths: claimsResult.data?.length || 0,
      },
    })
  } catch (error) {
    console.error("Insurance API error:", error)
    return NextResponse.json({ error: "Failed to fetch insurance data" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { type, ...data } = body

    if (type === "payer") {
      const { data: payer, error } = await supabase
        .from("insurance_payers")
        .insert({
          payer_name: data.payerName,
          payer_id: data.payerId,
          contact_name: data.contactName,
          contact_phone: data.contactPhone,
          contact_email: data.contactEmail,
          billing_address: data.billingAddress,
          electronic_payer_id: data.electronicPayerId,
          claim_submission_method: data.claimSubmissionMethod,
          prior_auth_required: data.priorAuthRequired,
          network_type: data.networkType,
          is_active: data.isActive,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ payer })
    }

    if (type === "patient-insurance") {
      const { data: insurance, error } = await supabase
        .from("patient_insurance")
        .insert({
          patient_id: data.patientId,
          payer_id: data.payerId,
          policy_number: data.policyNumber,
          group_number: data.groupNumber,
          subscriber_name: data.subscriberName,
          relationship_to_subscriber: data.relationshipToSubscriber,
          effective_date: data.effectiveDate,
          termination_date: data.terminationDate || null,
          copay_amount: data.copayAmount || null,
          deductible_amount: data.deductibleAmount || null,
          priority_order: data.priorityOrder,
          is_active: data.isActive,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ insurance })
    }

    if (type === "eligibility-check") {
      // Create eligibility request
      const { data: request, error } = await supabase
        .from("eligibility_requests")
        .insert({
          patient_id: data.patientId,
          payer_id: data.payerId,
          patient_insurance_id: data.patientInsuranceId,
          request_type: "eligibility",
          request_status: "completed",
          eligibility_status: "active",
          requested_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
          coverage_details: data.coverageDetails || {},
          copay_amount: data.copayAmount,
          deductible_amount: data.deductibleAmount,
          deductible_remaining: data.deductibleRemaining,
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ eligibilityRequest: request })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Insurance API POST error:", error)
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { type, id, ...data } = body

    if (type === "payer") {
      const { data: payer, error } = await supabase
        .from("insurance_payers")
        .update({
          payer_name: data.payerName,
          payer_id: data.payerId,
          contact_name: data.contactName,
          contact_phone: data.contactPhone,
          contact_email: data.contactEmail,
          billing_address: data.billingAddress,
          electronic_payer_id: data.electronicPayerId,
          claim_submission_method: data.claimSubmissionMethod,
          prior_auth_required: data.priorAuthRequired,
          network_type: data.networkType,
          is_active: data.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ payer })
    }

    if (type === "patient-insurance") {
      const { data: insurance, error } = await supabase
        .from("patient_insurance")
        .update({
          payer_id: data.payerId,
          policy_number: data.policyNumber,
          group_number: data.groupNumber,
          subscriber_name: data.subscriberName,
          relationship_to_subscriber: data.relationshipToSubscriber,
          effective_date: data.effectiveDate,
          termination_date: data.terminationDate || null,
          copay_amount: data.copayAmount || null,
          deductible_amount: data.deductibleAmount || null,
          priority_order: data.priorityOrder,
          is_active: data.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ insurance })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Insurance API PUT error:", error)
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 })
    }

    if (type === "payer") {
      const { error } = await supabase.from("insurance_payers").delete().eq("id", id)
      if (error) throw error
    }

    if (type === "patient-insurance") {
      const { error } = await supabase.from("patient_insurance").delete().eq("id", id)
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Insurance API DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
  }
}
