import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"

/**
 * API endpoint to execute research_studies migration
 * POST /api/research/migrate
 * 
 * This endpoint reads the SQL file and executes it via Supabase
 * Note: Supabase JS client doesn't support raw SQL, so we use the REST API
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
    const sqlPath = join(process.cwd(), "scripts", "create_research_studies_tables.sql")
    const sql = readFileSync(sqlPath, "utf-8")

    // Split SQL into statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"))

    const results = []
    let successCount = 0
    let errorCount = 0

    // Execute each statement via Supabase REST API
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement || statement.length < 10) continue

      try {
        // Use Supabase REST API to execute SQL
        // Note: This requires the exec_sql function or we use direct connection
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ sql: statement }),
        })

        if (response.ok) {
          successCount++
          results.push({ statement: i + 1, status: "success" })
        } else {
          const errorText = await response.text()
          if (errorText.includes("already exists") || errorText.includes("duplicate")) {
            successCount++
            results.push({ statement: i + 1, status: "exists", message: "Already exists" })
          } else {
            errorCount++
            results.push({ statement: i + 1, status: "error", message: errorText.substring(0, 200) })
          }
        }
      } catch (err) {
        errorCount++
        results.push({
          statement: i + 1,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      message: `Migration completed: ${successCount} successful, ${errorCount} errors`,
      results,
      total: statements.length,
      successful: successCount,
      errors: errorCount,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        error: "Failed to execute migration",
        message: error instanceof Error ? error.message : "Unknown error",
        note: "Please run the SQL script manually in Supabase SQL Editor",
      },
      { status: 500 }
    )
  }
}

