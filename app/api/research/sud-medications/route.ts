import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

const mockMedicationsData = [
  {
    id: "1",
    medication_name: "Naloxone Extended-Release Injectable",
    development_stage: "phase_3",
    target_indication: "Opioid Overdose Prevention",
    mechanism_of_action: "Mu-opioid receptor antagonist with extended duration",
    lead_researcher: "Dr. Maria Rodriguez",
    sponsor: "NIH HEAL Initiative",
    fda_ind_number: "IND-145892",
    enrollment_target: 500,
    enrollment_current: 423,
    primary_endpoints: ["Overdose reversal rate", "Duration of effect", "Safety profile"],
    efficacy_data: JSON.stringify({ success_rate: 94, mean_duration_hours: 72 }),
    safety_data: JSON.stringify({ adverse_events: 12, serious_adverse_events: 2 }),
    regulatory_milestones: JSON.stringify([
      { milestone: "IND Submission", date: "2024-03-15", status: "completed" },
      { milestone: "Phase 3 Initiation", date: "2024-08-01", status: "completed" },
      { milestone: "NDA Submission", date: "2026-06-01", status: "planned" },
    ]),
  },
  {
    id: "2",
    medication_name: "Buprenorphine + Naltrexone Combination",
    development_stage: "phase_2",
    target_indication: "Opioid + Alcohol Co-morbid SUD",
    mechanism_of_action: "Partial opioid agonist with opioid antagonist for dual treatment",
    lead_researcher: "Dr. James Patterson",
    sponsor: "SAMHSA + Private Partnership",
    fda_ind_number: "IND-148723",
    enrollment_target: 200,
    enrollment_current: 156,
    primary_endpoints: ["Dual abstinence rate", "Craving scores", "Treatment retention"],
    efficacy_data: null,
    safety_data: null,
    regulatory_milestones: JSON.stringify([
      { milestone: "IND Submission", date: "2024-11-20", status: "completed" },
      { milestone: "Phase 2 Enrollment", date: "2025-01-15", status: "in_progress" },
    ]),
  },
  {
    id: "3",
    medication_name: "Implantable Naltrexone Device",
    development_stage: "preclinical",
    target_indication: "Long-term Opioid Relapse Prevention",
    mechanism_of_action: "Continuous-release subcutaneous implant for 6-month duration",
    lead_researcher: "Dr. Sarah Chen",
    sponsor: "Internal R&D + NIH Grant",
    fda_ind_number: null,
    enrollment_target: 0,
    enrollment_current: 0,
    primary_endpoints: ["Steady-state plasma levels", "Device integrity", "Biocompatibility"],
    efficacy_data: null,
    safety_data: null,
    regulatory_milestones: JSON.stringify([
      { milestone: "Preclinical Design", date: "2024-06-01", status: "completed" },
      { milestone: "Animal Studies", date: "2025-03-01", status: "in_progress" },
      { milestone: "IND Submission", date: "2026-01-01", status: "planned" },
    ]),
  },
]

export async function GET(request: NextRequest) {
  try {
    const medications = await sql`
      SELECT * FROM sud_medication_development
      ORDER BY 
        CASE development_stage
          WHEN 'fda_review' THEN 1
          WHEN 'phase_3' THEN 2
          WHEN 'phase_2' THEN 3
          WHEN 'phase_1' THEN 4
          WHEN 'preclinical' THEN 5
          WHEN 'discovery' THEN 6
          ELSE 7
        END,
        medication_name
    `

    return NextResponse.json({ medications })
  } catch (error: any) {
    console.error("[v0] Error fetching SUD medications:", error)

    if (error?.code === "42P01") {
      console.log("[v0] sud_medication_development table not found, returning mock data")
      return NextResponse.json({ medications: mockMedicationsData })
    }

    return NextResponse.json(
      { error: "Failed to fetch medications", medications: mockMedicationsData },
      { status: 500 },
    )
  }
}
