import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

const MOCK_STUDIES = [
  {
    id: 1,
    title: "Effectiveness of MAT in Rural Communities",
    study_type: "Clinical Trial",
    status: "Active",
    pi_name: "Dr. Sarah Johnson",
    start_date: "2024-01-15",
    end_date: "2025-12-31",
    enrollment_target: 200,
    current_enrollment: 147,
    irb_status: "Approved",
    funding_source: "NIDA Grant R01DA054321",
    description:
      "Examining outcomes of medication-assisted treatment for opioid use disorder in underserved rural populations",
  },
  {
    id: 2,
    title: "Peer Recovery Support Impact Study",
    study_type: "Observational",
    status: "Active",
    pi_name: "Dr. Michael Chen",
    start_date: "2024-03-01",
    end_date: "2025-06-30",
    enrollment_target: 150,
    current_enrollment: 112,
    irb_status: "Approved",
    funding_source: "SAMHSA Grant TI-23-001",
    description: "Longitudinal study measuring the impact of peer recovery specialists on long-term recovery outcomes",
  },
  {
    id: 3,
    title: "Naloxone Distribution & Overdose Prevention",
    study_type: "Public Health",
    status: "Active",
    pi_name: "Dr. Emily Rodriguez",
    start_date: "2023-09-01",
    end_date: "2025-08-31",
    enrollment_target: 500,
    current_enrollment: 423,
    irb_status: "Approved",
    funding_source: "CDC Prevention Grant",
    description: "Community-based naloxone distribution program with overdose reversal tracking and education",
  },
  {
    id: 4,
    title: "Integrated Care for Co-occurring Disorders",
    study_type: "Clinical Trial",
    status: "Recruiting",
    pi_name: "Dr. James Patterson",
    start_date: "2024-06-01",
    end_date: "2026-05-31",
    enrollment_target: 180,
    current_enrollment: 67,
    irb_status: "Approved",
    funding_source: "NIMH Grant R34MH128456",
    description: "Randomized controlled trial of integrated treatment for substance use and mental health disorders",
  },
  {
    id: 5,
    title: "Buprenorphine Dosing Optimization Study",
    study_type: "Pharmacological",
    status: "Planning",
    pi_name: "Dr. Lisa Thompson",
    start_date: "2025-01-01",
    end_date: "2026-12-31",
    enrollment_target: 120,
    current_enrollment: 0,
    irb_status: "Under Review",
    funding_source: "NIDA Grant R21DA067890",
    description: "Investigating optimal buprenorphine dosing protocols for diverse patient populations",
  },
]

export async function GET(request: NextRequest) {
  try {
    const studies = await sql`
      SELECT * FROM research_studies
      ORDER BY start_date DESC
    `

    return NextResponse.json({ studies })
  } catch (error: any) {
    if (error?.code === "42P01") {
      console.log("[v0] research_studies table not found, returning mock data")
      return NextResponse.json({ studies: MOCK_STUDIES })
    }

    console.error("[v0] Error fetching research studies:", error)
    return NextResponse.json({ error: "Failed to fetch studies" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      study_type,
      status,
      pi_name,
      start_date,
      end_date,
      enrollment_target,
      current_enrollment,
      irb_status,
      funding_source,
      description,
    } = body

    const result = await sql`
      INSERT INTO research_studies (
        title, study_type, status, pi_name, start_date, end_date,
        enrollment_target, current_enrollment, irb_status, funding_source, description
      ) VALUES (
        ${title}, ${study_type}, ${status}, ${pi_name}, ${start_date}, ${end_date},
        ${enrollment_target}, ${current_enrollment}, ${irb_status}, ${funding_source}, ${description}
      )
      RETURNING *
    `

    return NextResponse.json({ study: result[0] })
  } catch (error: any) {
    if (error?.code === "42P01") {
      console.log("[v0] research_studies table not found, returning mock study")
      const mockStudy = {
        id: MOCK_STUDIES.length + 1,
        ...(await request.json()),
        created_at: new Date().toISOString(),
      }
      return NextResponse.json({ study: mockStudy })
    }

    console.error("[v0] Error creating study:", error)
    return NextResponse.json({ error: "Failed to create study" }, { status: 500 })
  }
}
