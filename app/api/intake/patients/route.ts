import { createServiceClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");

    // Fetch patients who are in the intake process
    // This includes:
    // 1. Patients with otp_admissions records with status 'pending_orientation'
    //    (These are patients from Patient Intake page who have started the intake process)
    // 2. Recent 'active' admissions (within last 7 days) that haven't been dosed yet
    //    (These are patients who completed orientation but haven't received first dose)
    // 3. Patients created recently (within last 30 days) who might be in data-entry stage
    //    (These are newly created patients who haven't started intake yet)

    // Get date threshold for recent active admissions (7 days ago)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // First, get all pending_orientation admissions (definitely in intake)
    // Use left join to handle cases where patient might be deleted
    const { data: pendingAdmissions, error: pendingError } = await supabase
      .from("otp_admissions")
      .select(
        `
        id,
        patient_id,
        admission_date,
        status,
        program_type,
        created_at,
        updated_at,
        patients(
          id,
          first_name,
          last_name,
          date_of_birth,
          phone,
          email,
          gender,
          address,
          created_at,
          client_number
        )
      `
      )
      .eq("status", "pending_orientation")
      .order("created_at", { ascending: false })
      .limit(100);

    if (pendingError) {
      console.error("[v0] Error fetching pending admissions:", pendingError);
    } else {
      console.log(
        "[v0] Found pending_orientation admissions:",
        pendingAdmissions?.length || 0
      );
    }

    // Get recent active admissions (within last 7 days)
    // Use left join to handle cases where patient might be deleted
    const { data: recentActiveAdmissions, error: activeError } = await supabase
      .from("otp_admissions")
      .select(
        `
        id,
        patient_id,
        admission_date,
        status,
        program_type,
        created_at,
        updated_at,
        patients(
          id,
          first_name,
          last_name,
          date_of_birth,
          phone,
          email,
          gender,
          address,
          created_at,
          client_number
        )
      `
      )
      .eq("status", "active")
      .gte("created_at", sevenDaysAgoISO)
      .order("created_at", { ascending: false })
      .limit(100);

    if (activeError) {
      console.error("[v0] Error fetching active admissions:", activeError);
    } else {
      console.log(
        "[v0] Found recent active admissions:",
        recentActiveAdmissions?.length || 0
      );
    }

    // Combine and filter out active admissions that have already been dosed
    const allAdmissions = [
      ...(pendingAdmissions || []),
      ...(recentActiveAdmissions || []),
    ];
    console.log("[v0] Total admissions found:", allAdmissions.length);

    const admissions: any[] = [];
    const patientIdsToCheck: string[] = [];

    // Collect patient IDs from active admissions to check for dosing
    for (const admission of allAdmissions) {
      if (!admission.patients) {
        console.warn("[v0] Admission missing patient data:", admission.id);
        continue;
      }

      if (admission.status === "pending_orientation") {
        // Always include pending_orientation patients
        admissions.push(admission);
      } else if (admission.status === "active") {
        // Check if they've been dosed
        patientIdsToCheck.push(admission.patient_id);
      }
    }

    // Batch check for dosing records
    if (patientIdsToCheck.length > 0) {
      const { data: dosingRecords, error: dosingError } = await supabase
        .from("dosing_log")
        .select("patient_id")
        .in("patient_id", patientIdsToCheck);

      if (dosingError) {
        console.warn("[v0] Error checking dosing records:", dosingError);
      }

      const dosedPatientIds = new Set(
        (dosingRecords || []).map((d: any) => d.patient_id)
      );

      // Add active admissions that haven't been dosed
      for (const admission of allAdmissions) {
        if (
          admission.status === "active" &&
          !dosedPatientIds.has(admission.patient_id)
        ) {
          if (admission.patients) {
            admissions.push(admission);
          }
        }
      }
    }

    console.log("[v0] Admissions after filtering:", admissions.length);

    // Get patient IDs from admissions
    const patientIds = admissions.map((a: any) => a.patient_id);

    // Also get recently created patients (within last 90 days) who might not have admission records yet
    // Increased to 90 days to catch more patients
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: allRecentPatients, error: recentPatientsError } =
      await supabase
        .from("patients")
        .select(
          `
        id,
        first_name,
        last_name,
        date_of_birth,
        phone,
        email,
        gender,
        address,
        created_at,
        client_number
      `
        )
        .gte("created_at", ninetyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(200);

    if (recentPatientsError) {
      console.error(
        "[v0] Error fetching recent patients:",
        recentPatientsError
      );
    } else {
      console.log(
        "[v0] Found recent patients (last 90 days):",
        allRecentPatients?.length || 0
      );
    }

    // Also check for patients with intake progress but no admission record
    // This catches patients who started intake but admission wasn't created
    let patientsWithProgress: string[] = [];
    try {
      const REQUIREMENT_NAME = "Patient Intake Progress";
      const { data: progressRequirement } = await supabase
        .from("chart_requirements")
        .select("id")
        .eq("requirement_name", REQUIREMENT_NAME)
        .maybeSingle();

      if (progressRequirement) {
        const { data: progressItems } = await supabase
          .from("patient_chart_items")
          .select("patient_id")
          .eq("requirement_id", progressRequirement.id)
          .gte("created_at", ninetyDaysAgo.toISOString());

        if (progressItems) {
          patientsWithProgress = progressItems.map((p: any) => p.patient_id);
          console.log(
            "[v0] Found patients with intake progress:",
            patientsWithProgress.length
          );
        }
      }
    } catch (progressError) {
      console.warn("[v0] Could not check intake progress:", progressError);
    }

    // Include all recent patients who don't have admissions yet
    // These are patients in the data-entry stage
    const recentPatients = (allRecentPatients || [])
      .filter((p: any) => !patientIds.includes(p.id))
      .slice(0, 50);

    console.log(
      "[v0] Recent patients (data-entry stage):",
      recentPatients.length
    );

    // Combine admissions and recent patients
    const allIntakePatients: any[] = [];

    // Process admissions
    for (const admission of admissions || []) {
      const patient = admission.patients;
      if (!patient) continue;

      // Get intake progress for this patient
      const progressData = await getIntakeProgress(supabase, patient.id);

      // Determine current stage
      const currentStage = determineIntakeStage(admission, progressData);

      // Get eligibility status
      let eligibilityStatus = "pending";
      try {
        const { data: insurance } = await supabase
          .from("patient_insurance")
          .select("is_active")
          .eq("patient_id", patient.id)
          .eq("is_active", true)
          .limit(1);

        eligibilityStatus =
          insurance && insurance.length > 0 ? "approved" : "pending";
      } catch (insuranceError) {
        // If table doesn't exist or error, default to pending
        console.error("[v0] Error checking insurance:", insuranceError);
        eligibilityStatus = "pending";
      }

      // Check for UDS and pregnancy test requirements
      // UDS is typically required during intake
      let udsRequired = true;
      let pregnancyTestRequired = false;

      try {
        const { data: udsData } = await supabase
          .from("urine_drug_screens")
          .select("id, collection_date")
          .eq("patient_id", patient.id)
          .order("collection_date", { ascending: false })
          .limit(1);

        // If UDS exists and was collected recently (within last 7 days), it's not required
        if (udsData && udsData.length > 0) {
          const udsDate = new Date(udsData[0].collection_date);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          if (udsDate >= sevenDaysAgo) {
            udsRequired = false;
          }
        }

        // Pregnancy test required for females if UDS is required
        if (patient.gender?.toLowerCase() === "female" && udsRequired) {
          pregnancyTestRequired = true;
        }
      } catch (udsError) {
        // If table doesn't exist or error, assume UDS is required
        console.error("[v0] Error checking UDS:", udsError);
        udsRequired = true;
        if (patient.gender?.toLowerCase() === "female") {
          pregnancyTestRequired = true;
        }
      }

      // Check for recent vitals (within last 7 days)
      let hasRecentVitals = false;
      let lastVitalsDate: string | null = null;
      let lastVitalsTime: string | null = null;
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: vitalsData } = await supabase
          .from("vital_signs")
          .select("id, measurement_date, created_at")
          .eq("patient_id", patient.id)
          .gte("measurement_date", sevenDaysAgo.toISOString())
          .order("measurement_date", { ascending: false })
          .limit(1);

        if (vitalsData && vitalsData.length > 0) {
          hasRecentVitals = true;
          const vitalsDate = new Date(vitalsData[0].measurement_date || vitalsData[0].created_at);
          lastVitalsDate = vitalsDate.toLocaleDateString();
          lastVitalsTime = vitalsDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
      } catch (vitalsError) {
        // If table doesn't exist or error, assume no recent vitals
        console.error("[v0] Error checking vitals:", vitalsError);
        hasRecentVitals = false;
      }

      // Determine priority
      const priority = determinePriority(admission, progressData);

      // Get alerts
      const alerts = getAlerts(admission, progressData, patient);

      // Calculate estimated wait time (simplified - could be more sophisticated)
      const estimatedWait = calculateEstimatedWait(currentStage);

      allIntakePatients.push({
        id: `INT-${admission.id.slice(0, 8).toUpperCase()}`,
        patientId: patient.id,
        name: `${patient.first_name} ${patient.last_name}`,
        age: calculateAge(patient.date_of_birth),
        phone: patient.phone || "(555) 000-0000",
        email: patient.email || "",
        gender: patient.gender || "",
        address: patient.address || "",
        entryTime: new Date(
          admission.admission_date || admission.created_at
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        currentStage,
        eligibilityStatus,
        udsRequired,
        pregnancyTestRequired,
        priority,
        estimatedWait,
        alerts,
        dob: patient.date_of_birth,
        admissionId: admission.id,
        admissionStatus: admission.status,
        hasRecentVitals,
        lastVitalsDate,
        lastVitalsTime,
      });
    }

    // Process recent patients without admissions (data-entry stage)
    for (const patient of recentPatients || []) {
      // Check if they already have an admission (shouldn't happen, but just in case)
      const hasAdmission = admissions?.some(
        (a: any) => a.patient_id === patient.id
      );
      if (hasAdmission) continue;

      // Check for recent vitals for data-entry stage patients
      let hasRecentVitals = false;
      let lastVitalsDate: string | null = null;
      let lastVitalsTime: string | null = null;
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: vitalsData } = await supabase
          .from("vital_signs")
          .select("id, measurement_date, created_at")
          .eq("patient_id", patient.id)
          .gte("measurement_date", sevenDaysAgo.toISOString())
          .order("measurement_date", { ascending: false })
          .limit(1);

        if (vitalsData && vitalsData.length > 0) {
          hasRecentVitals = true;
          const vitalsDate = new Date(vitalsData[0].measurement_date || vitalsData[0].created_at);
          lastVitalsDate = vitalsDate.toLocaleDateString();
          lastVitalsTime = vitalsDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
        }
      } catch (vitalsError) {
        // Silently fail - vitals check is optional
        console.error("[v0] Error checking vitals:", vitalsError);
      }

      allIntakePatients.push({
        id: `INT-${patient.id.slice(0, 8).toUpperCase()}`,
        patientId: patient.id,
        name: `${patient.first_name} ${patient.last_name}`,
        age: calculateAge(patient.date_of_birth),
        phone: patient.phone || "(555) 000-0000",
        email: patient.email || "",
        gender: patient.gender || "",
        address: patient.address || "",
        entryTime: new Date(patient.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        currentStage: "data-entry",
        eligibilityStatus: "pending",
        udsRequired: true,
        pregnancyTestRequired: patient.gender?.toLowerCase() === "female",
        priority: "normal",
        estimatedWait: "30 min",
        alerts: [],
        dob: patient.date_of_birth,
        admissionId: null,
        admissionStatus: null,
        hasRecentVitals,
        lastVitalsDate,
        lastVitalsTime,
      });
    }

    // Filter by stage if provided
    let filteredPatients = allIntakePatients;
    if (stage && stage !== "all") {
      filteredPatients = allIntakePatients.filter(
        (p) => p.currentStage === stage
      );
    }

    console.log("[v0] Final intake patients count:", {
      total: filteredPatients.length,
      fromAdmissions: admissions.length,
      fromRecentPatients: recentPatients.length,
      byStage: stage || "all",
      stageBreakdown: filteredPatients.reduce((acc: any, p: any) => {
        acc[p.currentStage] = (acc[p.currentStage] || 0) + 1;
        return acc;
      }, {}),
    });

    return NextResponse.json(filteredPatients);
  } catch (error) {
    console.error("[v0] Intake patients API error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("patients")
      .insert({
        first_name: body.firstName,
        last_name: body.lastName,
        date_of_birth: body.dateOfBirth,
        phone: body.phone,
        email: body.email,
        gender: body.gender,
        address: body.address,
        status: "intake",
      })
      .select()
      .single();

    if (error) {
      console.error("[v0] Error creating intake patient:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Create intake patient error:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 }
    );
  }
}

async function getIntakeProgress(supabase: any, patientId: string) {
  try {
    // Get the intake progress requirement
    const REQUIREMENT_NAME = "Patient Intake Progress";
    const { data: requirement, error: reqError } = await supabase
      .from("chart_requirements")
      .select("id")
      .eq("requirement_name", REQUIREMENT_NAME)
      .maybeSingle();

    if (reqError) {
      // Table might not exist or requirement might not be created yet
      console.warn(
        "[v0] Could not find intake progress requirement:",
        reqError.message
      );
      return null;
    }

    if (!requirement) {
      return null;
    }

    // Get progress data from patient_chart_items
    const { data: progressItem, error: progressError } = await supabase
      .from("patient_chart_items")
      .select("*")
      .eq("patient_id", patientId)
      .eq("requirement_id", requirement.id)
      .maybeSingle();

    if (progressError) {
      // Table might not exist
      console.warn(
        "[v0] Could not fetch patient chart items:",
        progressError.message
      );
      return null;
    }

    if (!progressItem || !progressItem.notes) {
      return null;
    }

    try {
      const progressData = JSON.parse(progressItem.notes);
      return {
        ...progressData,
        status: progressItem.status,
        completed_date: progressItem.completed_date,
      };
    } catch (parseError) {
      console.warn("[v0] Could not parse progress data:", parseError);
      return null;
    }
  } catch (error) {
    console.error("[v0] Error fetching intake progress:", error);
    return null;
  }
}

function determineIntakeStage(admission: any, progressData: any): string {
  // If no admission or status is not intake-related, return data-entry
  if (!admission || !admission.status) {
    return "data-entry";
  }

  // If status is pending_orientation, check progress
  if (admission.status === "pending_orientation") {
    if (!progressData || !progressData.orientation_progress) {
      return "data-entry";
    }

    const orientationProgress = progressData.orientation_progress || 0;

    if (orientationProgress < 100) {
      // Check if eligibility is verified
      if (!progressData.eligibility_verified) {
        return "eligibility";
      }
      return "tech-onboarding";
    }

    // Orientation complete, check consent forms
    const docStatus = progressData.documentation_status || {};
    const allConsentsComplete = Object.values(docStatus).every(
      (status: any) => status === "completed"
    );

    if (!allConsentsComplete) {
      return "consent-forms";
    }

    // Consents done, check UDS
    return "collector-queue";
  }

  // If status is active, check what's been completed
  if (admission.status === "active") {
    if (progressData) {
      // Check if UDS is done
      // This would need to be checked separately, but for now assume if active, might be in later stages
      const docStatus = progressData.documentation_status || {};
      const allConsentsComplete = Object.values(docStatus).every(
        (status: any) => status === "completed"
      );

      if (!allConsentsComplete) {
        return "consent-forms";
      }

      // Check assessments - simplified logic
      const assessmentData = progressData.assessment_data || {};
      if (!assessmentData.primary_substance) {
        return "collector-queue";
      }

      // Assume assessments are done if we have assessment data
      // In a real system, you'd check specific assessment completion
      return "dosing";
    }

    return "collector-queue";
  }

  // Default to data-entry
  return "data-entry";
}

function determinePriority(
  admission: any,
  progressData: any
): "normal" | "urgent" {
  // Check if there are urgent indicators
  if (progressData?.alerts?.includes("Withdrawal symptoms")) {
    return "urgent";
  }

  // Check if admission is very recent (within last hour) - might be urgent
  const admissionDate = new Date(
    admission.created_at || admission.admission_date
  );
  const now = new Date();
  const hoursSinceAdmission =
    (now.getTime() - admissionDate.getTime()) / (1000 * 60 * 60);

  if (hoursSinceAdmission < 1) {
    return "urgent";
  }

  return "normal";
}

function getAlerts(admission: any, progressData: any, patient: any): string[] {
  const alerts: string[] = [];

  // Check for withdrawal symptoms
  if (progressData?.assessment_data?.withdrawal_symptoms) {
    alerts.push("Withdrawal symptoms");
  }

  // Check if pregnant (for females)
  if (patient.gender?.toLowerCase() === "female") {
    if (
      progressData?.pregnancy_test_required ||
      progressData?.pregnancy_test_positive
    ) {
      alerts.push("Pregnant");
    }
  }

  // Check for high risk indicators
  if (progressData?.assessment_data?.high_risk) {
    alerts.push("High risk");
  }

  // Check if new patient (admission created today)
  const admissionDate = new Date(
    admission.created_at || admission.admission_date
  );
  const today = new Date();
  if (
    admissionDate.getDate() === today.getDate() &&
    admissionDate.getMonth() === today.getMonth() &&
    admissionDate.getFullYear() === today.getFullYear()
  ) {
    alerts.push("New patient");
  }

  return alerts;
}

function calculateEstimatedWait(currentStage: string): string {
  // Simplified wait time calculation based on stage
  const waitTimes: Record<string, string> = {
    "data-entry": "30 min",
    eligibility: "20 min",
    "tech-onboarding": "15 min",
    "consent-forms": "10 min",
    "collector-queue": "5 min",
    "nurse-queue": "15 min",
    "counselor-queue": "20 min",
    "doctor-queue": "25 min",
    dosing: "5 min",
  };

  return waitTimes[currentStage] || "15 min";
}

function calculateAge(dob: string): number {
  if (!dob) return 0;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function getMockIntakePatients() {
  return [
    {
      id: "INT-2025-001",
      patientId: 1,
      name: "Maria Santos",
      age: 29,
      phone: "(555) 123-4567",
      email: "maria.santos@example.com",
      gender: "female",
      address: "123 Main St, Anytown",
      entryTime: "08:30 AM",
      currentStage: "data-entry",
      eligibilityStatus: "pending",
      udsRequired: true,
      pregnancyTestRequired: true,
      priority: "normal",
      estimatedWait: "15 min",
      alerts: [],
    },
    {
      id: "INT-2025-002",
      patientId: 2,
      name: "James Rodriguez",
      age: 34,
      phone: "(555) 234-5678",
      email: "james.rodriguez@example.com",
      gender: "male",
      address: "456 Elm St, Othertown",
      entryTime: "09:15 AM",
      currentStage: "collector-queue",
      eligibilityStatus: "approved",
      udsRequired: true,
      pregnancyTestRequired: false,
      priority: "urgent",
      estimatedWait: "5 min",
      alerts: ["Withdrawal symptoms"],
    },
    {
      id: "INT-2025-003",
      patientId: 3,
      name: "Sarah Johnson",
      age: 26,
      phone: "(555) 345-6789",
      email: "sarah.johnson@example.com",
      gender: "female",
      address: "789 Oak St, Somewhere",
      entryTime: "10:00 AM",
      currentStage: "nurse-queue",
      eligibilityStatus: "approved",
      udsRequired: false,
      pregnancyTestRequired: false,
      priority: "normal",
      estimatedWait: "20 min",
      alerts: [],
    },
  ];
}
