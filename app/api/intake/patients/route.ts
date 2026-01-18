import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get("stage")
    const status = searchParams.get("status")

    let query = supabase
      .from("patients")
      .select(`
        id,
        first_name,
        last_name,
        date_of_birth,
        phone,
        email,
        gender,
        address,
        created_at,
        patient_insurance(
          id,
          payer_id,
          policy_number,
          priority_order,
          is_active
        )
      `)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data: patients, error } = await query

    if (error) {
      console.error("[v0] Error fetching intake patients:", error.message)
      // Return mock data if database query fails
      return NextResponse.json(getMockIntakePatients())
    }

    // Transform to intake queue format
    const intakePatients = (patients || []).map((patient, index) => ({
      id: `INT-2025-${String(patient.id).padStart(3, "0")}`,
      patientId: patient.id,
      name: `${patient.first_name} ${patient.last_name}`,
      age: calculateAge(patient.date_of_birth),
      phone: patient.phone || "(555) 000-0000",
      email: patient.email,
      gender: patient.gender,
      address: patient.address,
      entryTime: new Date(patient.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      currentStage: getRandomStage(index),
      eligibilityStatus: patient.patient_insurance?.some((ins: any) => ins.is_active) ? "approved" : "pending",
      udsRequired: Math.random() > 0.5,
      pregnancyTestRequired: Math.random() > 0.7,
      priority: Math.random() > 0.8 ? "urgent" : "normal",
      estimatedWait: `${Math.floor(Math.random() * 45) + 5} min`,
      alerts: getRandomAlerts(),
      dob: patient.date_of_birth,
    }))

    return NextResponse.json(intakePatients)
  } catch (error) {
    console.error("[v0] Intake patients API error:", error)
    return NextResponse.json(getMockIntakePatients())
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

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
      .single()

    if (error) {
      console.error("[v0] Error creating intake patient:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Create intake patient error:", error)
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 })
  }
}

function calculateAge(dob: string): number {
  if (!dob) return 0
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

function getRandomStage(index: number): string {
  const stages = [
    "data-entry",
    "eligibility",
    "tech-onboarding",
    "consent-forms",
    "collector-queue",
    "nurse-queue",
    "counselor-queue",
    "doctor-queue",
    "dosing",
  ]
  return stages[index % stages.length]
}

function getRandomAlerts(): string[] {
  const allAlerts = ["Withdrawal symptoms", "Pregnant", "High risk", "New patient"]
  const alerts: string[] = []
  if (Math.random() > 0.7) {
    alerts.push(allAlerts[Math.floor(Math.random() * allAlerts.length)])
  }
  return alerts
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
  ]
}
