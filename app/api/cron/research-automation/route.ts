import { NextResponse } from "next/server"
import { automateStudyStatuses } from "@/lib/research-automation"

/**
 * Cron job endpoint for automated research study status updates
 * 
 * This endpoint is called automatically by a cron service (Vercel Cron, external cron, etc.)
 * 
 * To use with Vercel Cron:
 * 1. Create vercel.json with cron configuration
 * 2. Deploy to Vercel
 * 
 * To use with external cron service:
 * 1. Set up cron job to call: https://your-domain.com/api/cron/research-automation
 * 2. Add authorization header (see below)
 * 
 * Security: This endpoint should be protected with a secret token
 */
export async function GET(request: Request) {
  try {
    // Security: Verify cron secret token
    const vercelCronHeader = request.headers.get("x-vercel-cron")
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    
    // If CRON_SECRET is set, require authentication (for external cron services)
    if (cronSecret) {
      // Vercel Cron automatically includes x-vercel-cron header
      if (vercelCronHeader) {
        // This is a Vercel Cron request - allow it
      } else if (authHeader === `Bearer ${cronSecret}`) {
        // This is an external cron with correct secret - allow it
      } else {
        // No valid authentication
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
    } else {
      // If no CRON_SECRET is set, only allow Vercel Cron requests
      if (!vercelCronHeader) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      }
    }

    // Run automation
    const result = await automateStudyStatuses()

    const totalUpdates = result.updated + result.irb_updated
    let message = ""

    if (result.updated > 0 && result.irb_updated > 0) {
      message = `Automated ${result.updated} study status update${result.updated !== 1 ? "s" : ""} and ${result.irb_updated} IRB status update${result.irb_updated !== 1 ? "s" : ""}`
    } else if (result.updated > 0) {
      message = `Automated ${result.updated} study status update${result.updated !== 1 ? "s" : ""}`
    } else if (result.irb_updated > 0) {
      message = `Automated ${result.irb_updated} IRB status update${result.irb_updated !== 1 ? "s" : ""}`
    } else {
      message = "No updates needed"
    }

    // Log the automation run
    console.log(`[Research Automation Cron] ${new Date().toISOString()} - ${message}`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      updated: result.updated,
      changes: result.changes,
      irb_updated: result.irb_updated,
      irb_changes: result.irb_changes,
      total_updates: totalUpdates,
      message,
    })
  } catch (error) {
    console.error("Unexpected error in cron /api/cron/research-automation:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request)
}

