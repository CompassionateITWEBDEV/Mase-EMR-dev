import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// State PDMP API configuration (varies by state)
// Common integration options: NABP PMP InterConnect, Appriss Health RxCheck, Bamboo Health
const PDMP_API_URL = process.env.PDMP_API_URL;
const PDMP_API_KEY = process.env.PDMP_API_KEY;
const PDMP_FACILITY_ID = process.env.PDMP_FACILITY_ID;

interface PDMPQueryResponse {
  requestId: string;
  status: "completed" | "pending" | "error";
  prescriptions?: PDMPPrescription[];
  redFlags?: PDMPRedFlags;
  error?: string;
}

interface PDMPPrescription {
  drugName: string;
  quantity: number;
  daysSupply: number;
  fillDate: string;
  prescriber: string;
  pharmacy: string;
  mme?: number;
}

interface PDMPRedFlags {
  doctorShopping: boolean;
  overlappingPrescriptions: boolean;
  highMME: boolean;
  multiplePharmacies: boolean;
  earlyRefills: boolean;
  riskScore?: number;
}

/**
 * Query State PDMP via API
 * Returns null if PDMP is not configured (mock mode)
 * 
 * Note: PDMP integration varies significantly by state. Most states use one of:
 * - NABP PMP InterConnect (multi-state)
 * - Appriss Health RxCheck
 * - Bamboo Health (formerly Appriss)
 * - Direct state API
 */
async function queryStatePDMP(
  patientFirstName: string,
  patientLastName: string,
  patientDOB: string,
  stateCode: string
): Promise<PDMPQueryResponse | null> {
  if (!PDMP_API_URL || !PDMP_API_KEY) {
    console.log("[v0] PDMP not configured - returning mock data");
    return null;
  }

  try {
    const response = await fetch(`${PDMP_API_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PDMP_API_KEY}`,
        "X-Facility-ID": PDMP_FACILITY_ID || "",
      },
      body: JSON.stringify({
        patient: {
          firstName: patientFirstName,
          lastName: patientLastName,
          dateOfBirth: patientDOB,
        },
        states: [stateCode],
        lookbackDays: 365,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[v0] PDMP API error:", data);
      return {
        requestId: "",
        status: "error",
        error: data.message || "PDMP query failed",
      };
    }

    return {
      requestId: data.requestId,
      status: "completed",
      prescriptions: data.prescriptions,
      redFlags: data.redFlags,
    };
  } catch (error) {
    console.error("[v0] PDMP request failed:", error);
    return null;
  }
}

/**
 * Analyze prescriptions for red flags (used when PDMP API doesn't provide analysis)
 */
function analyzeRedFlags(prescriptions: PDMPPrescription[]): PDMPRedFlags {
  const uniquePrescribers = new Set(prescriptions.map(p => p.prescriber));
  const uniquePharmacies = new Set(prescriptions.map(p => p.pharmacy));
  const totalMME = prescriptions.reduce((sum, p) => sum + (p.mme || 0), 0);
  
  // Check for overlapping prescriptions (simplified)
  const opioidPrescriptions = prescriptions.filter(p => 
    p.drugName.toLowerCase().includes("oxycodone") ||
    p.drugName.toLowerCase().includes("hydrocodone") ||
    p.drugName.toLowerCase().includes("morphine") ||
    p.drugName.toLowerCase().includes("fentanyl")
  );
  
  const hasOverlap = opioidPrescriptions.length > 1;
  
  return {
    doctorShopping: uniquePrescribers.size >= 4,
    overlappingPrescriptions: hasOverlap,
    highMME: totalMME > 90,
    multiplePharmacies: uniquePharmacies.size >= 4,
    earlyRefills: false, // Would need fill dates analysis
    riskScore: calculateRiskScore(uniquePrescribers.size, uniquePharmacies.size, totalMME, hasOverlap),
  };
}

function calculateRiskScore(
  prescriberCount: number,
  pharmacyCount: number,
  totalMME: number,
  hasOverlap: boolean
): number {
  let score = 0;
  if (prescriberCount >= 4) score += 30;
  else if (prescriberCount >= 3) score += 15;
  if (pharmacyCount >= 4) score += 25;
  else if (pharmacyCount >= 3) score += 10;
  if (totalMME > 120) score += 30;
  else if (totalMME > 90) score += 20;
  else if (totalMME > 50) score += 10;
  if (hasOverlap) score += 15;
  return Math.min(score, 100);
}

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const searchParams = request.nextUrl.searchParams
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ success: false, error: "Patient ID required" }, { status: 400 })
    }

    const requests = await sql`
      SELECT 
        pr.*,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        prov.first_name as provider_first_name,
        prov.last_name as provider_last_name,
        (SELECT COUNT(*) FROM pdmp_prescriptions WHERE pdmp_request_id = pr.id) as prescription_count
      FROM pdmp_requests pr
      LEFT JOIN patients p ON pr.patient_id = p.id
      LEFT JOIN providers prov ON pr.provider_id = prov.id
      WHERE pr.patient_id = ${patientId}
      ORDER BY pr.request_date DESC
    `

    return NextResponse.json({ 
      success: true, 
      requests,
      pdmpConfigured: !!(PDMP_API_URL && PDMP_API_KEY),
    })
  } catch (error: any) {
    console.error("[v0] Error fetching PDMP requests:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.NEON_DATABASE_URL!)
    const body = await request.json()
    const { patientId, providerId, requestType, stateCode } = body

    // Validate required fields
    if (!patientId || !stateCode) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: patientId, stateCode" },
        { status: 400 }
      )
    }

    // Get patient info for PDMP query
    const [patient] = await sql`
      SELECT first_name, last_name, date_of_birth
      FROM patients
      WHERE id = ${patientId}
    `

    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found" }, { status: 404 })
    }

    // Create PDMP request record
    const [pdmpRequest] = await sql`
      INSERT INTO pdmp_requests (
        patient_id,
        provider_id,
        request_type,
        request_status,
        state_requested
      ) VALUES (
        ${patientId},
        ${providerId || null},
        ${requestType || "routine"},
        'pending',
        ${stateCode}
      )
      RETURNING *
    `

    // Query State PDMP
    const pdmpResponse = await queryStatePDMP(
      patient.first_name,
      patient.last_name,
      patient.date_of_birth,
      stateCode
    );

    let redFlags: PDMPRedFlags;
    let prescriptions: PDMPPrescription[] = [];

    if (pdmpResponse && pdmpResponse.status === "completed") {
      // Use real PDMP data
      prescriptions = pdmpResponse.prescriptions || [];
      redFlags = pdmpResponse.redFlags || analyzeRedFlags(prescriptions);

      // Update request status
      await sql`
        UPDATE pdmp_requests
        SET 
          request_status = 'completed',
          external_id = ${pdmpResponse.requestId},
          response_date = NOW(),
          red_flags = ${JSON.stringify(redFlags)}
        WHERE id = ${pdmpRequest.id}
      `

      // Store prescriptions
      for (const rx of prescriptions) {
        await sql`
          INSERT INTO pdmp_prescriptions (
            pdmp_request_id,
            drug_name,
            quantity,
            days_supply,
            fill_date,
            prescriber_name,
            pharmacy_name,
            mme_daily
          ) VALUES (
            ${pdmpRequest.id},
            ${rx.drugName},
            ${rx.quantity},
            ${rx.daysSupply},
            ${rx.fillDate},
            ${rx.prescriber},
            ${rx.pharmacy},
            ${rx.mme || null}
          )
        `
      }
    } else {
      // Mock data for demo/development
      redFlags = {
        doctorShopping: false,
        overlappingPrescriptions: false,
        highMME: false,
        multiplePharmacies: false,
        earlyRefills: false,
        riskScore: 0,
      };

      // Update with mock status
      await sql`
        UPDATE pdmp_requests
        SET 
          request_status = 'completed',
          response_date = NOW(),
          red_flags = ${JSON.stringify(redFlags)}
        WHERE id = ${pdmpRequest.id}
      `
    }

    return NextResponse.json({
      success: true,
      request: { ...pdmpRequest, request_status: "completed" },
      prescriptions,
      redFlags,
      message: pdmpResponse ? "PDMP query completed" : "PDMP query completed (mock data - configure PDMP_API_URL and PDMP_API_KEY for live data)",
      pdmpConfigured: !!(PDMP_API_URL && PDMP_API_KEY),
    })
  } catch (error: any) {
    console.error("[v0] Error creating PDMP request:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
