import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch claims with patient and payer info
    const { data: claims, error: claimsError } = await supabase
      .from("insurance_claims")
      .select(`
        *,
        patients (first_name, last_name),
        insurance_payers (payer_name),
        providers (first_name, last_name)
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (claimsError) throw claimsError

    // Fetch claim batches
    const { data: batches, error: batchesError } = await supabase
      .from("claim_batches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (batchesError) throw batchesError

    // Fetch patients for dropdown
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, first_name, last_name")
      .order("last_name")

    if (patientsError) throw patientsError

    // Fetch payers for dropdown
    const { data: payers, error: payersError } = await supabase
      .from("insurance_payers")
      .select("id, payer_name, payer_id")
      .eq("is_active", true)
      .order("payer_name")

    if (payersError) throw payersError

    // Fetch providers for dropdown
    const { data: providers, error: providersError } = await supabase
      .from("providers")
      .select("id, first_name, last_name")
      .order("last_name")

    if (providersError) throw providersError

    // Calculate summary stats
    const totalCharges = claims?.reduce((sum, c) => sum + (Number(c.total_charges) || 0), 0) || 0
    const totalPaid = claims?.reduce((sum, c) => sum + (Number(c.paid_amount) || 0), 0) || 0
    const pendingClaims = claims?.filter((c) => c.claim_status === "pending" || c.claim_status === "submitted") || []
    const pendingAmount = pendingClaims.reduce((sum, c) => sum + (Number(c.total_charges) || 0), 0)
    const paidClaims = claims?.filter((c) => c.claim_status === "paid") || []
    const collectionRate = totalCharges > 0 ? ((totalPaid / totalCharges) * 100).toFixed(1) : "0"

    return NextResponse.json({
      claims:
        claims?.map((c) => ({
          id: c.id,
          claimNumber: c.claim_number || `CLM-${c.id.slice(0, 8)}`,
          patientName: c.patients ? `${c.patients.first_name} ${c.patients.last_name}` : "Unknown",
          patientId: c.patient_id,
          payerName: c.insurance_payers?.payer_name || "Unknown Payer",
          payerId: c.payer_id,
          providerName: c.providers ? `${c.providers.first_name} ${c.providers.last_name}` : "Unknown",
          providerId: c.provider_id,
          serviceDate: c.service_date,
          submissionDate: c.submission_date,
          totalCharges: Number(c.total_charges) || 0,
          allowedAmount: c.allowed_amount ? Number(c.allowed_amount) : undefined,
          paidAmount: c.paid_amount ? Number(c.paid_amount) : undefined,
          patientResponsibility: c.patient_responsibility ? Number(c.patient_responsibility) : undefined,
          status: c.claim_status || "pending",
          claimType: c.claim_type || "professional",
          denialReason: c.denial_reason,
          appealStatus: c.appeal_status,
          appealDate: c.appeal_date,
          notes: c.notes,
        })) || [],
      batches:
        batches?.map((b) => ({
          id: b.id,
          batchNumber: b.batch_number,
          batchType: b.batch_type,
          batchStatus: b.batch_status,
          totalClaims: b.total_claims || 0,
          totalCharges: Number(b.total_charges) || 0,
          submittedAt: b.submitted_at,
          createdAt: b.created_at,
          notes: b.notes,
        })) || [],
      patients: patients || [],
      payers: payers || [],
      providers: providers || [],
      summary: {
        totalCharges,
        totalPaid,
        pendingAmount,
        pendingCount: pendingClaims.length,
        paidCount: paidClaims.length,
        totalCount: claims?.length || 0,
        collectionRate,
      },
    })
  } catch (error) {
    console.error("Error fetching claims:", error)
    return NextResponse.json({ error: "Failed to fetch claims" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { type } = body

    if (type === "claim") {
      // Create manual claim entry
      const {
        patientId,
        payerId,
        providerId,
        serviceDate,
        totalCharges,
        claimType,
        notes,
        diagnosisCodes,
        procedureCodes,
      } = body

      // Generate claim number
      const claimNumber = `MAN-${Date.now().toString(36).toUpperCase()}`

      const { data, error } = await supabase
        .from("insurance_claims")
        .insert({
          patient_id: patientId,
          payer_id: payerId,
          provider_id: providerId,
          service_date: serviceDate,
          submission_date: new Date().toISOString().split("T")[0],
          total_charges: totalCharges,
          claim_type: claimType || "professional",
          claim_status: "pending",
          claim_number: claimNumber,
          notes: notes,
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ success: true, claim: data })
    } else if (type === "batch") {
      // Create manual batch entry
      const { batchType, claimIds, notes } = body

      // Generate batch number
      const batchNumber = `BATCH-${Date.now().toString(36).toUpperCase()}`

      const { data, error } = await supabase
        .from("claim_batches")
        .insert({
          batch_number: batchNumber,
          batch_type: batchType || "837P",
          batch_status: "pending",
          total_claims: claimIds?.length || 0,
          total_charges: 0,
          notes: notes,
        })
        .select()
        .single()

      if (error) throw error

      // Update claims to reference this batch if claimIds provided
      if (claimIds && claimIds.length > 0) {
        // Get total charges for the batch
        const { data: claimsData } = await supabase.from("insurance_claims").select("total_charges").in("id", claimIds)

        const totalCharges = claimsData?.reduce((sum, c) => sum + (Number(c.total_charges) || 0), 0) || 0

        // Update batch with total charges
        await supabase.from("claim_batches").update({ total_charges: totalCharges }).eq("id", data.id)
      }

      return NextResponse.json({ success: true, batch: data })
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 })
  } catch (error) {
    console.error("Error creating claim/batch:", error)
    return NextResponse.json({ error: "Failed to create claim/batch" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, action, ...updates } = body

    if (action === "submit") {
      // Submit claim
      const { error } = await supabase
        .from("insurance_claims")
        .update({
          claim_status: "submitted",
          submission_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)

      if (error) throw error
    } else if (action === "appeal") {
      // Appeal denied claim
      const { error } = await supabase
        .from("insurance_claims")
        .update({
          claim_status: "appealed",
          appeal_status: "pending",
          appeal_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", id)

      if (error) throw error
    } else if (action === "update") {
      // General update
      const { error } = await supabase.from("insurance_claims").update(updates).eq("id", id)

      if (error) throw error
    } else if (action === "submit_batch") {
      // Submit batch
      const { error } = await supabase
        .from("claim_batches")
        .update({
          batch_status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating claim:", error)
    return NextResponse.json({ error: "Failed to update claim" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Claim ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("insurance_claims").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting claim:", error)
    return NextResponse.json({ error: "Failed to delete claim" }, { status: 500 })
  }
}
