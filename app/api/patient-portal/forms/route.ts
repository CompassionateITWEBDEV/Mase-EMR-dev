import { createServiceClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    const { patientId, formKey, formData } = body;

    if (!patientId || !formKey) {
      return NextResponse.json(
        { error: "Patient ID and form key are required" },
        { status: 400 }
      );
    }

    // Get patient's organization_id if available
    const { data: patientData } = await supabase
      .from("patients")
      .select("organization_id")
      .eq("id", patientId)
      .maybeSingle();

    // Find the intake progress requirement
    const REQUIREMENT_NAME = "Patient Intake Progress";
    let requirementQuery = supabase
      .from("chart_requirements")
      .select("id")
      .eq("requirement_name", REQUIREMENT_NAME);

    if (patientData?.organization_id) {
      requirementQuery = requirementQuery.eq(
        "organization_id",
        patientData.organization_id
      );
    } else {
      requirementQuery = requirementQuery.is("organization_id", null);
    }

    const { data: requirement } = await requirementQuery.maybeSingle();

    if (!requirement) {
      return NextResponse.json(
        { error: "Intake progress requirement not found" },
        { status: 404 }
      );
    }

    // Get existing progress data
    const { data: progressItems } = await supabase
      .from("patient_chart_items")
      .select("*")
      .eq("patient_id", patientId)
      .eq("requirement_id", requirement.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    let progressData: any = {
      type: "intake_progress",
      orientation_progress: 0,
      completed_items: [],
      documentation_status: {},
      assessment_data: {},
      saved_at: new Date().toISOString(),
    };

    if (progressItems && progressItems.length > 0) {
      try {
        const notes = progressItems[0].notes;
        if (notes) {
          const parsed = typeof notes === "string" ? JSON.parse(notes) : notes;
          if (parsed.type === "intake_progress") {
            progressData = { ...parsed };
          }
        }
      } catch (e) {
        console.warn(
          "[Patient Portal Forms] Could not parse existing progress:",
          e
        );
      }
    }

    // Update documentation_status for this form
    if (!progressData.documentation_status) {
      progressData.documentation_status = {};
    }
    progressData.documentation_status[formKey] = "completed";

    // Update patient_chart_items
    const progressRecord: any = {
      patient_id: patientId,
      requirement_id: requirement.id,
      due_date: new Date().toISOString().split("T")[0],
      completed_date: null,
      status: "pending",
      notes: JSON.stringify(progressData),
      updated_at: new Date().toISOString(),
    };

    if (progressItems && progressItems.length > 0) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("patient_chart_items")
        .update(progressRecord)
        .eq("id", progressItems[0].id);

      if (updateError) {
        console.error(
          "[Patient Portal Forms] Error updating progress:",
          updateError
        );
        throw updateError;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("patient_chart_items")
        .insert(progressRecord);

      if (insertError) {
        console.error(
          "[Patient Portal Forms] Error inserting progress:",
          insertError
        );
        throw insertError;
      }
    }

    // Create form record in patient_assessments
    // First, try to find a matching form in assessment_forms_catalog
    const { data: formCatalog } = await supabase
      .from("assessment_forms_catalog")
      .select("id, form_name")
      .ilike("form_name", `%${formKey.replace(/_/g, " ")}%`)
      .limit(1)
      .maybeSingle();

    const formName =
      formCatalog?.form_name || REQUIRED_FORMS_MAPPING[formKey] || formKey;

    // Create assessment record
    const assessmentData: any = {
      patient_id: patientId,
      form_id: formCatalog?.id || null,
      status: "completed",
      completed_at: new Date().toISOString(),
      assessment_data: formData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: assessment, error: assessmentError } = await supabase
      .from("patient_assessments")
      .insert(assessmentData)
      .select()
      .single();

    if (assessmentError) {
      console.warn(
        "[Patient Portal Forms] Error creating assessment record:",
        assessmentError
      );
      // Don't fail the request if assessment creation fails, progress update is more important
    }

    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
      assessment: assessment || null,
    });
  } catch (error: any) {
    console.error("[Patient Portal Forms] Error submitting form:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit form" },
      { status: 500 }
    );
  }
}

// Required Forms Mapping (same as in frontend)
const REQUIRED_FORMS_MAPPING: Record<string, string> = {
  consent_for_treatment: "Consent For Treatment",
  hipaa_authorization: "HIPAA Authorization",
  financial_agreement: "Financial Agreement",
  emergency_contact_form: "Emergency Contact Form",
  photo_id_verification: "Photo ID Verification",
  insurance_card_copy: "Insurance Card Copy",
  hhn_enrollment: "HHN Enrollment",
  patient_handbook_receipt: "Patient Handbook Receipt",
};
