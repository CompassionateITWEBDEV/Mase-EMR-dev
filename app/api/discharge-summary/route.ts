import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return NextResponse.json(
        { error: "Database connection not configured" },
        { status: 500 }
      );
    }
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.NEON_DATABASE_URL);
    const summaries = await sql`
      SELECT 
        ds.*,
        p.first_name || ' ' || p.last_name as patient_name,
        pr.first_name || ' ' || pr.last_name as provider_name
      FROM discharge_summaries ds
      LEFT JOIN patients p ON ds.patient_id = p.id
      LEFT JOIN providers pr ON ds.provider_id = pr.id
      ORDER BY ds.created_at DESC
    `;

    return NextResponse.json(summaries);
  } catch (error) {
    console.error("[v0] Error fetching discharge summaries:", error);
    return NextResponse.json(
      { error: "Failed to fetch discharge summaries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEON_DATABASE_URL) {
      return NextResponse.json(
        { error: "Database connection not configured" },
        { status: 500 }
      );
    }
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.NEON_DATABASE_URL);
    const body = await request.json();

    const result = await sql`
      INSERT INTO discharge_summaries (
        patient_id,
        provider_id,
        admission_date,
        discharge_date,
        admission_diagnosis,
        discharge_diagnosis,
        reason_for_admission,
        clinical_course,
        treatment_summary,
        response_to_treatment,
        complications,
        discharge_condition,
        discharge_disposition,
        functional_status,
        aftercare_plan,
        discharge_instructions,
        medication_instructions,
        activity_restrictions,
        diet_recommendations,
        warning_signs,
        follow_up_date,
        follow_up_provider,
        special_considerations,
        barriers_to_discharge,
        family_involvement,
        support_system_notes,
        patient_education_provided,
        emergency_contact_info,
        medications_at_discharge,
        follow_up_appointments,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${body.patient_id || null},
        ${body.provider_id || null},
        ${body.admission_date || null},
        ${body.discharge_date || null},
        ${body.admission_diagnosis || null},
        ${body.discharge_diagnosis || null},
        ${body.reason_for_admission || null},
        ${body.clinical_course || null},
        ${body.treatment_summary || null},
        ${body.response_to_treatment || null},
        ${body.complications || null},
        ${body.discharge_condition || null},
        ${body.discharge_disposition || null},
        ${body.functional_status || null},
        ${body.aftercare_plan || null},
        ${body.discharge_instructions || null},
        ${body.medication_instructions || null},
        ${body.activity_restrictions || null},
        ${body.diet_recommendations || null},
        ${body.warning_signs || null},
        ${body.follow_up_date || null},
        ${body.follow_up_provider || null},
        ${body.special_considerations || null},
        ${body.barriers_to_discharge || null},
        ${body.family_involvement || null},
        ${body.support_system_notes || null},
        ${body.patient_education_provided || null},
        ${body.emergency_contact_info || null},
        ${JSON.stringify(body.medications_at_discharge || [])},
        ${JSON.stringify(body.follow_up_appointments || [])},
        ${body.status || "draft"},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error("[v0] Error creating discharge summary:", error);
    return NextResponse.json(
      { error: "Failed to create discharge summary" },
      { status: 500 }
    );
  }
}
