import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const mockTrials = [
  {
    id: 1,
    title: "Cognitive Behavioral Therapy for Depression in MAT Patients",
    phase: "Phase 3",
    status: "Enrolling",
    condition: "Major Depressive Disorder, Opioid Use Disorder",
    intervention: "Cognitive Behavioral Therapy",
    sponsor: "NIDA",
    enrollment: 150,
    startDate: "2024-01-15",
    estimatedCompletion: "2025-06-30",
    eligibility: "Adults 18-65 currently in MAT program",
    locations: "Multi-site across DC, MD, VA",
    contactEmail: "trials@research.example.org",
    nctNumber: "NCT12345678",
  },
  {
    id: 2,
    title: "Extended-Release Naltrexone vs Buprenorphine for OUD",
    phase: "Phase 4",
    status: "Active",
    condition: "Opioid Use Disorder",
    intervention: "Extended-Release Naltrexone, Buprenorphine/Naloxone",
    sponsor: "SAMHSA",
    enrollment: 200,
    startDate: "2023-09-01",
    estimatedCompletion: "2025-12-31",
    eligibility: "Adults 18+ with OUD diagnosis",
    locations: "Washington DC Metro Area",
    contactEmail: "oud-study@research.example.org",
    nctNumber: "NCT87654321",
  },
  {
    id: 3,
    title: "Peer Support Integration in Substance Use Treatment",
    phase: "Phase 2",
    status: "Enrolling",
    condition: "Substance Use Disorder",
    intervention: "Peer Recovery Support Services",
    sponsor: "CDC Foundation",
    enrollment: 100,
    startDate: "2024-03-01",
    estimatedCompletion: "2025-09-30",
    eligibility: "Adults in outpatient treatment programs",
    locations: "Community Health Centers - DC",
    contactEmail: "peer-support@research.example.org",
    nctNumber: "NCT11223344",
  },
  {
    id: 4,
    title: "Contingency Management for Stimulant Use Disorder",
    phase: "Phase 3",
    status: "Active",
    condition: "Cocaine Use Disorder, Methamphetamine Use Disorder",
    intervention: "Contingency Management with Financial Incentives",
    sponsor: "NIH",
    enrollment: 180,
    startDate: "2023-11-01",
    estimatedCompletion: "2025-10-31",
    eligibility: "Adults 21+ with stimulant use diagnosis",
    locations: "Multiple behavioral health clinics",
    contactEmail: "cm-trial@research.example.org",
    nctNumber: "NCT99887766",
  },
]

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)

    const trials = await sql`
      SELECT * FROM clinical_trials
      WHERE status IN ('Enrolling', 'Active')
      ORDER BY phase, title
    `

    return NextResponse.json({ trials })
  } catch (error: any) {
    if (error?.code === "42P01") {
      console.log("[v0] clinical_trials table doesn't exist, returning mock data")
      return NextResponse.json({ trials: mockTrials })
    }

    console.error("[v0] Error fetching clinical trials:", error)
    return NextResponse.json({ error: "Failed to fetch trials" }, { status: 500 })
  }
}
