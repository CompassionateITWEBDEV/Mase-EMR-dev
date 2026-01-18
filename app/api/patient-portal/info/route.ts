import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(getMockPatientInfo());
    }

    const { data: patient, error } = await supabase
      .from("patients")
      .select(
        `
        id,
        first_name,
        last_name,
        date_of_birth,
        phone,
        email,
        status,
        created_at,
        prescriptions(
          id,
          medication_name,
          dosage,
          frequency,
          status,
          prescribed_date
        ),
        appointments(
          id,
          appointment_date,
          appointment_time,
          status,
          appointment_type,
          providers(first_name, last_name)
        )
      `
      )
      .eq("id", patientId)
      .single();

    if (error || !patient) {
      console.error("[v0] Error fetching patient portal info:", error);
      return NextResponse.json(getMockPatientInfo());
    }

    // Find active prescription for program info
    const activePrescription = patient.prescriptions?.find(
      (p: any) => p.status === "active"
    );

    // Find next appointment
    const upcomingAppointment = patient.appointments
      ?.filter(
        (a: any) =>
          a.status === "scheduled" && new Date(a.appointment_date) >= new Date()
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.appointment_date).getTime() -
          new Date(b.appointment_date).getTime()
      )[0];

    return NextResponse.json({
      name: `${patient.first_name} ${patient.last_name}`,
      id: `PT-${patient.id}`,
      patientId: patient.id, // Add the actual patient database ID
      program: activePrescription?.medication_name || "Treatment Program",
      dose: activePrescription?.dosage || "N/A",
      nextAppointment: upcomingAppointment
        ? `${new Date(
            upcomingAppointment.appointment_date
          ).toLocaleDateString()} at ${upcomingAppointment.appointment_time}`
        : "No upcoming appointments",
      counselor: upcomingAppointment?.providers
        ? `Dr. ${
            Array.isArray(upcomingAppointment.providers)
              ? (upcomingAppointment.providers as { last_name: string }[])[0]
                  ?.last_name
              : (upcomingAppointment.providers as { last_name: string })
                  .last_name
          }`
        : "Assigned Counselor",
      counselorPhone: "(555) 123-4567",
      recoveryDays: calculateRecoveryDays(
        (patient as { created_at: string }).created_at
      ),
    });
  } catch (error) {
    console.error("[v0] Patient portal info error:", error);
    return NextResponse.json(getMockPatientInfo());
  }
}

function calculateRecoveryDays(startDate: string): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getMockPatientInfo() {
  return {
    name: "Sarah Johnson",
    id: "PT-2024-001",
    patientId: null, // Will be null for demo - frontend should handle this
    program: "Methadone Program",
    dose: "80mg",
    nextAppointment: "January 18, 2024 at 10:00 AM",
    counselor: "Dr. Smith",
    counselorPhone: "(555) 123-4567",
    recoveryDays: 127,
  };
}
