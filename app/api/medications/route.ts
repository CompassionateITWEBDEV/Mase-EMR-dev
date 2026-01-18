import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createServerClient()
  const { searchParams } = new URL(request.url)

  const patientId = searchParams.get("patient_id")
  const status = searchParams.get("status") || "active"
  const medicationType = searchParams.get("medication_type")

  let query = supabase
    .from("patient_medications")
    .select(`
      *,
      patient:patients(id, first_name, last_name),
      prescriber:staff!prescribed_by(id, first_name, last_name),
      pharmacy:pharmacies(id, name, phone)
    `)
    .order("created_at", { ascending: false })

  if (patientId && patientId !== "all") {
    query = query.eq("patient_id", patientId)
  }

  if (status !== "all") {
    query = query.eq("status", status)
  }

  if (medicationType) {
    query = query.eq("medication_type", medicationType)
  }

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching medications:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data to match frontend interface
  const medications = data?.map((med: any) => ({
    ...med,
    patient_name: med.patient ? `${med.patient.first_name} ${med.patient.last_name}` : "Unknown",
    prescriber_name: med.prescriber ? `${med.prescriber.first_name} ${med.prescriber.last_name}` : "Unknown",
    pharmacy_name: med.pharmacy?.name,
    pharmacy_phone: med.pharmacy?.phone,
  }))

  return NextResponse.json({ medications })
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const body = await request.json()

  const { data, error } = await supabase.from("patient_medications").insert([body]).select().single()

  if (error) {
    console.error("[v0] Error creating medication:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ medication: data })
}
