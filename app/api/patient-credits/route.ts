import { type NextRequest, NextResponse } from "next/server";

// Lazy initialization with memoization to avoid build-time errors
// and prevent creating multiple client instances
let sqlClient: any = null;
let importPromise: Promise<any> | null = null;

async function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  // Reuse existing client if available
  if (sqlClient) {
    return sqlClient;
  }

  // If import is in progress, wait for it
  if (importPromise) {
    await importPromise;
    return sqlClient;
  }

  // Lazy import to avoid build-time errors
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  importPromise = import("@neondatabase/serverless").then((module) => {
    const { neon } = module;
    sqlClient = neon(databaseUrl);
    return sqlClient;
  });

  await importPromise;
  return sqlClient;
}

export async function GET(req: NextRequest) {
  try {
    const sql = await getSql();

    const { searchParams } = new URL(req.url);
    const patient_id = searchParams.get("patient_id");

    if (!patient_id) {
      return NextResponse.json(
        { error: "Patient ID required" },
        { status: 400 }
      );
    }

    // Get total available credits
    const result = (await sql`
      SELECT get_patient_available_credits(${patient_id}::uuid) as total_credits
    `) as Array<{ total_credits: number }>;

    // Get credit history
    const credits = (await sql`
      SELECT 
        id,
        credit_amount,
        credit_type,
        credit_reason,
        remaining_amount,
        status,
        applied_at,
        expires_at,
        notes
      FROM patient_credits
      WHERE patient_id = ${patient_id}::uuid
      ORDER BY applied_at DESC
    `) as Array<any>;

    return NextResponse.json({
      total_credits: result[0]?.total_credits || 0,
      credits: credits,
    });
  } catch (error) {
    console.error("[Patient Credits] Error fetching patient credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sql = await getSql();

    const body = await req.json();
    const {
      patient_id,
      credit_amount,
      credit_type,
      credit_reason,
      applied_by,
      notes,
      expires_at,
    } = body;

    if (!patient_id || !credit_amount || !credit_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert new credit
    const result = (await sql`
      INSERT INTO patient_credits (
        patient_id, 
        credit_amount, 
        credit_type, 
        credit_reason, 
        applied_by,
        remaining_amount,
        expires_at,
        notes
      )
      VALUES (
        ${patient_id}::uuid,
        ${credit_amount},
        ${credit_type},
        ${credit_reason || null},
        ${applied_by}::uuid,
        ${credit_amount},
        ${expires_at || null},
        ${notes || null}
      )
      RETURNING *
    `) as Array<any>;

    return NextResponse.json({ success: true, credit: result[0] });
  } catch (error) {
    console.error("[Patient Credits] Error applying credit:", error);
    return NextResponse.json(
      { error: "Failed to apply credit" },
      { status: 500 }
    );
  }
}
