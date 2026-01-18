import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch patients from patient_dispensing table
    const { data: patients, error } = await supabase
      .from("patient_dispensing")
      .select("id, name, mrn, dob")
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching patients:", error)
      // Also try patients table as fallback
      const { data: fallbackPatients } = await supabase
        .from("patients")
        .select("id, first_name, last_name")
        .order("last_name", { ascending: true })
        .limit(50)

      const formattedFallback = (fallbackPatients || []).map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
      }))

      return NextResponse.json({ patients: formattedFallback })
    }

    return NextResponse.json({ patients: patients || [] })
  } catch (error) {
    console.error("[v0] Patients error:", error)
    return NextResponse.json({ patients: [] })
  }
}
