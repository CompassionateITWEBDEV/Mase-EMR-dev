import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { getStudyAuditTrail } from "@/lib/research-audit"

// GET - Get audit trail for a study
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const studyId = params.id

    if (!studyId) {
      return NextResponse.json({ error: "Study ID is required" }, { status: 400 })
    }

    const auditLogs = await getStudyAuditTrail(studyId)

    return NextResponse.json({
      success: true,
      audit_logs: auditLogs,
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/research/studies/[id]/audit:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

