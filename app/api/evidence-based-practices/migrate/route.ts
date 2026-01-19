import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

/**
 * API endpoint to execute evidence_based_practices migration
 * POST /api/evidence-based-practices/migrate
 * 
 * This endpoint reads the SQL file and attempts to execute it
 * Note: Supabase JS client doesn't support raw SQL directly,
 * so this provides the SQL content for manual execution or uses pg library
 */
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase environment variables not configured" },
        { status: 500 }
      )
    }

    // Read the SQL file
    const sqlPath = join(process.cwd(), "scripts", "create_evidence_based_practices_tables.sql")
    const sql = readFileSync(sqlPath, "utf-8")

    // Return the SQL content for execution
    // Since Supabase JS client doesn't support raw SQL, we'll provide instructions
    return NextResponse.json({
      success: true,
      message: "SQL file loaded successfully. Please execute manually in Supabase SQL Editor.",
      sql: sql,
      instructions: [
        "1. Open your Supabase Dashboard",
        "2. Go to SQL Editor",
        "3. Click 'New Query'",
        "4. Copy and paste the SQL content below",
        "5. Click 'Run' to execute",
        "6. Refresh this page after execution"
      ],
      note: "For automated execution, use the Node.js script: node scripts/execute-ebp-migration.js"
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        error: "Failed to load migration file",
        message: error instanceof Error ? error.message : "Unknown error",
        note: "Please run the SQL script manually in Supabase SQL Editor",
      },
      { status: 500 }
    )
  }
}

// GET - Return migration status and SQL content
export async function GET() {
  try {
    const supabase = createServiceClient()
    
    // Check if tables exist
    const tables = [
      'evidence_based_practices',
      'ebp_fidelity_assessments',
      'ebp_staff_assignments',
      'ebp_patient_delivery',
      'ebp_outcomes'
    ]
    
    const tableStatus: Record<string, boolean> = {}
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1)
        tableStatus[table] = !error
      } catch {
        tableStatus[table] = false
      }
    }
    
    const allExist = Object.values(tableStatus).every(exists => exists)
    
    // Read SQL file
    const sqlPath = join(process.cwd(), "scripts", "create_evidence_based_practices_tables.sql")
    let sql = ""
    try {
      sql = readFileSync(sqlPath, "utf-8")
    } catch (err) {
      console.error("Error reading SQL file:", err)
      // File not found - continue without SQL
    }
    
    return NextResponse.json({
      migrated: allExist,
      tableStatus,
      sql: sql || null,
      message: allExist 
        ? "All EBP tables exist. Migration already completed." 
        : "EBP tables not found. Migration required."
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to check migration status",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

