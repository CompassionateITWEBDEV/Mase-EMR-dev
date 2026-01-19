import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { recalculateEbpMetrics } from "../../utils/calculate-metrics"

// GET - Get training records for an EBP
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Get staff assignments
    const { data: assignments, error } = await supabase
      .from("ebp_staff_assignments")
      .select("*")
      .eq("ebp_id", ebpId)
      .order("assigned_at", { ascending: false })

    if (error) {
      console.error("Error fetching training records:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get statistics
    const trainedCount = assignments?.filter(a => a.status === 'trained' || a.status === 'certified').length || 0
    const certifiedCount = assignments?.filter(a => a.status === 'certified').length || 0
    const pendingCount = assignments?.filter(a => a.status === 'pending').length || 0

    return NextResponse.json({
      success: true,
      records: assignments || [],
      statistics: {
        total: assignments?.length || 0,
        trained: trainedCount,
        certified: certifiedCount,
        pending: pendingCount,
      },
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/evidence-based-practices/[id]/training-records:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// POST - Assign/train staff for an EBP
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServiceClient()
    const ebpId = params.id
    const body = await request.json()

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Validation
    if (!body.staff_id) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 })
    }

    if (body.status && !['pending', 'trained', 'certified', 'inactive'].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Date validation
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (body.training_date) {
      const trainingDate = new Date(body.training_date)
      trainingDate.setHours(0, 0, 0, 0)
      if (trainingDate > today) {
        return NextResponse.json({ error: "Training date cannot be in the future" }, { status: 400 })
      }
    }

    if (body.certification_date) {
      const certDate = new Date(body.certification_date)
      certDate.setHours(0, 0, 0, 0)
      if (certDate > today) {
        return NextResponse.json({ error: "Certification date cannot be in the future" }, { status: 400 })
      }
      
      // Certification date should be after or equal to training date
      if (body.training_date) {
        const trainingDate = new Date(body.training_date)
        trainingDate.setHours(0, 0, 0, 0)
        if (certDate < trainingDate) {
          return NextResponse.json({ error: "Certification date cannot be before training date" }, { status: 400 })
        }
      }
    }

    if (body.certification_expires_date) {
      const expiresDate = new Date(body.certification_expires_date)
      expiresDate.setHours(0, 0, 0, 0)
      
      // Expiration date should be after certification date
      if (body.certification_date) {
        const certDate = new Date(body.certification_date)
        certDate.setHours(0, 0, 0, 0)
        if (expiresDate <= certDate) {
          return NextResponse.json({ error: "Certification expiration date must be after certification date" }, { status: 400 })
        }
      } else {
        // If no certification date, expiration should be in the future
        if (expiresDate <= today) {
          return NextResponse.json({ error: "Certification expiration date must be in the future" }, { status: 400 })
        }
      }
    }

    // Prepare assignment data
    const assignmentData = {
      ebp_id: ebpId,
      staff_id: body.staff_id,
      organization_id: body.organization_id || null,
      status: body.status || 'pending',
      training_date: body.training_date || null,
      certification_date: body.certification_date || null,
      certification_expires_date: body.certification_expires_date || null,
      certificate_url: body.certificate_url || null,
      training_module_id: body.training_module_id || null,
      assigned_by: body.assigned_by || null,
    }

    // Insert or update assignment (UPSERT)
    const { data, error } = await supabase
      .from("ebp_staff_assignments")
      .upsert(assignmentData, { onConflict: 'ebp_id,staff_id' })
      .select()
      .single()

    if (error) {
      console.error("Error creating training record:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Recalculate and update cached metrics
    try {
      await recalculateEbpMetrics(ebpId)
    } catch (metricError) {
      console.warn("Error recalculating metrics after training record update:", metricError)
      // Don't fail the request if metric calculation fails
    }

    return NextResponse.json({
      success: true,
      record: data,
      message: "Training record created/updated successfully",
    }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error in POST /api/evidence-based-practices/[id]/training-records:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

