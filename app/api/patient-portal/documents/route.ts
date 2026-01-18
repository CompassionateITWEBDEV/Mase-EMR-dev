import { createServiceClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    // Always return required forms, even if patientId is missing
    // This allows the UI to display forms for testing/demo purposes
    const formMapping: Record<string, string> = {
      consent_for_treatment: "Consent For Treatment",
      hipaa_authorization: "HIPAA Authorization",
      financial_agreement: "Financial Agreement",
      emergency_contact_form: "Emergency Contact Form",
      photo_id_verification: "Photo ID Verification",
      insurance_card_copy: "Insurance Card Copy",
      hhn_enrollment: "HHN Enrollment",
      patient_handbook_receipt: "Patient Handbook Receipt",
    };

    // Initialize all forms with "pending" status
    let requiredForms: Array<{
      formKey: string;
      displayName: string;
      status: string;
    }> = Object.entries(formMapping).map(([key, displayName]) => ({
      formKey: key,
      displayName,
      status: "pending",
    }));

    if (!patientId) {
      // Return forms with pending status even without patientId
      return NextResponse.json({
        treatmentPlans: [],
        consents: [],
        dischargeSummaries: [],
        medications: [],
        requiredForms: requiredForms,
      });
    }

    // Get treatment plans
    const { data: treatmentPlans } = await supabase
      .from("treatment_plans")
      .select(
        `
        *,
        provider:providers(first_name, last_name)
      `
      )
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    // Get consent forms from patient assessments
    const { data: consents } = await supabase
      .from("patient_assessments")
      .select(
        `
        *,
        form:assessment_forms_catalog(form_name, category)
      `
      )
      .eq("patient_id", patientId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    // Get discharge summaries
    const { data: dischargeSummaries } = await supabase
      .from("discharge_summaries")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    // Get medications
    const { data: medications } = await supabase
      .from("patient_medications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .order("start_date", { ascending: false });

    // Get required forms from intake documentation status
    // Update form statuses based on intake progress if available
    try {
      console.log(
        "[Patient Portal Documents] Fetching required forms for patientId:",
        patientId
      );

      // Get patient's organization_id if available
      const { data: patientData } = await supabase
        .from("patients")
        .select("organization_id")
        .eq("id", patientId)
        .maybeSingle();

      console.log("[Patient Portal Documents] Patient data:", patientData);

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
      console.log(
        "[Patient Portal Documents] Requirement found:",
        requirement?.id
      );

      if (requirement) {
        const { data: progressItems, error: progressError } = await supabase
          .from("patient_chart_items")
          .select("*")
          .eq("patient_id", patientId)
          .eq("requirement_id", requirement.id)
          .order("updated_at", { ascending: false })
          .limit(1);

        console.log(
          "[Patient Portal Documents] Progress items:",
          progressItems?.length || 0,
          progressError
        );

        if (progressItems && progressItems.length > 0) {
          try {
            const notes = progressItems[0].notes;
            if (notes) {
              const parsed =
                typeof notes === "string" ? JSON.parse(notes) : notes;
              console.log(
                "[Patient Portal Documents] Parsed notes type:",
                parsed.type
              );

              if (
                parsed.type === "intake_progress" &&
                parsed.documentation_status
              ) {
                const docStatus = parsed.documentation_status;
                console.log(
                  "[Patient Portal Documents] Documentation status:",
                  docStatus
                );

                // Update form statuses based on intake progress
                requiredForms = Object.entries(formMapping).map(
                  ([key, displayName]) => ({
                    formKey: key,
                    displayName,
                    status: docStatus[key] || "pending",
                  })
                );
              }
            }
          } catch (e) {
            console.warn(
              "[Patient Portal Documents] Could not parse documentation status:",
              e
            );
          }
        }
      } else {
        console.log(
          "[Patient Portal Documents] No requirement found, using default pending status"
        );
      }
    } catch (error) {
      console.error(
        "[Patient Portal Documents] Error fetching required forms:",
        error
      );
      // Continue with default "pending" status for all forms
    }

    console.log(
      "[Patient Portal Documents] Returning requiredForms:",
      requiredForms.length
    );

    return NextResponse.json({
      treatmentPlans: treatmentPlans || [],
      consents: consents || [],
      dischargeSummaries: dischargeSummaries || [],
      medications: medications || [],
      requiredForms: requiredForms || [],
    });
  } catch (error) {
    console.error("Error fetching patient documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
