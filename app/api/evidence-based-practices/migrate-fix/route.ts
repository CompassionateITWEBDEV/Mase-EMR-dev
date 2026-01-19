import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

/**
 * POST - Apply the EBP fidelity trigger fix
 * This endpoint executes the SQL fix script to resolve the GROUP BY error
 */
export async function POST(request: Request) {
  try {
    // Optional: Add authentication/authorization check here
    // const authHeader = request.headers.get("authorization")
    // if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const supabase = createServiceClient()

    // Read the SQL fix script
    const sqlPath = path.join(process.cwd(), "scripts", "fix_ebp_fidelity_trigger_final.sql")
    const sqlScript = fs.readFileSync(sqlPath, "utf8")

    // Split into individual statements (separated by semicolons)
    // Filter out comments and empty statements
    const statements = sqlScript
      .split(/;\s*(?=\n|$)/)
      .map((s) => s.trim())
      .filter((s) => {
        // Remove comments
        const withoutComments = s.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")
        return withoutComments.length > 0 && !withoutComments.match(/^\s*$/)
      })

    const results: Array<{ statement: number; success: boolean; error?: string }> = []

    // Execute each statement using Supabase's RPC or direct query
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API's query endpoint
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement || statement.length === 0) continue

      try {
        // Use Supabase's REST API to execute SQL
        // This requires using the service role key with the REST API directly
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
            },
            body: JSON.stringify({ sql: statement }),
          }
        )

        if (!response.ok) {
          // If RPC doesn't exist, try alternative approach
          // Execute via Supabase's query builder where possible
          // For DDL statements, we may need to use a different method
          
          // Alternative: Use pg library or Supabase's migration system
          // For now, we'll return the SQL for manual execution
          results.push({
            statement: i + 1,
            success: false,
            error: "Direct SQL execution not available via JS client",
          })
        } else {
          results.push({
            statement: i + 1,
            success: true,
          })
        }
      } catch (err) {
        results.push({
          statement: i + 1,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    // Since Supabase JS client has limitations with DDL statements,
    // we'll provide the SQL script for execution
    return NextResponse.json({
      success: true,
      message: "SQL script prepared. Please execute manually in Supabase SQL Editor.",
      sqlScript: sqlScript,
      statementsCount: statements.length,
      results,
      instructions: [
        "1. Open Supabase Dashboard",
        "2. Navigate to SQL Editor",
        "3. Copy the SQL script below",
        "4. Paste and click 'Run'",
      ],
    })
  } catch (error) {
    console.error("Error in migrate-fix endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

