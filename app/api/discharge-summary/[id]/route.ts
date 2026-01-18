import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return NextResponse.json(
        { error: "Database connection not configured" },
        { status: 500 }
      );
    }
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.NEON_DATABASE_URL);
    const { id } = await params;
    const result = await sql`
      SELECT
        ds.*,
        p.first_name || ' ' || p.last_name as patient_name,
        pr.first_name || ' ' || pr.last_name as provider_name
      FROM discharge_summaries ds
      LEFT JOIN patients p ON ds.patient_id = p.id
      LEFT JOIN providers pr ON ds.provider_id = pr.id
      WHERE ds.id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Discharge summary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("[v0] Error fetching discharge summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch discharge summary" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return NextResponse.json(
        { error: "Database connection not configured" },
        { status: 500 }
      );
    }
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.NEON_DATABASE_URL);
    const { id } = await params;
    const body = await request.json();

    const result = await sql`
      UPDATE discharge_summaries
      SET
        admission_date = ${body.admission_date || null},
        discharge_date = ${body.discharge_date || null},
        admission_diagnosis = ${body.admission_diagnosis || null},
        discharge_diagnosis = ${body.discharge_diagnosis || null},
        reason_for_admission = ${body.reason_for_admission || null},
        clinical_course = ${body.clinical_course || null},
        treatment_summary = ${body.treatment_summary || null},
        response_to_treatment = ${body.response_to_treatment || null},
        complications = ${body.complications || null},
        discharge_condition = ${body.discharge_condition || null},
        discharge_disposition = ${body.discharge_disposition || null},
        functional_status = ${body.functional_status || null},
        aftercare_plan = ${body.aftercare_plan || null},
        discharge_instructions = ${body.discharge_instructions || null},
        medication_instructions = ${body.medication_instructions || null},
        activity_restrictions = ${body.activity_restrictions || null},
        diet_recommendations = ${body.diet_recommendations || null},
        warning_signs = ${body.warning_signs || null},
        follow_up_date = ${body.follow_up_date || null},
        follow_up_provider = ${body.follow_up_provider || null},
        special_considerations = ${body.special_considerations || null},
        barriers_to_discharge = ${body.barriers_to_discharge || null},
        family_involvement = ${body.family_involvement || null},
        support_system_notes = ${body.support_system_notes || null},
        patient_education_provided = ${body.patient_education_provided || null},
        emergency_contact_info = ${body.emergency_contact_info || null},
        medications_at_discharge = ${JSON.stringify(
          body.medications_at_discharge || []
        )},
        follow_up_appointments = ${JSON.stringify(
          body.follow_up_appointments || []
        )},
        status = ${body.status || "draft"},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Discharge summary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("[v0] Error updating discharge summary:", error);
    return NextResponse.json(
      { error: "Failed to update discharge summary" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return NextResponse.json(
        { error: "Database connection not configured" },
        { status: 500 }
      );
    }
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.NEON_DATABASE_URL);
    const { id } = await params;
    await sql`
      DELETE FROM discharge_summaries
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[v0] Error deleting discharge summary:", error);
    return NextResponse.json(
      { error: "Failed to delete discharge summary" },
      { status: 500 }
    );
  }
}
