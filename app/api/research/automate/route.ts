import { NextResponse } from "next/server"
import { automateStudyStatuses } from "@/lib/research-automation"

// POST - Run study status and IRB status automation
export async function POST(request: Request) {
  try {
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

    // Add skipped info to message if any studies were skipped
    if (result.skipped > 0) {
      message += `. ${result.skipped} stud${result.skipped !== 1 ? "ies" : "y"} skipped (IRB not approved)`
    }

    return NextResponse.json({
      success: true,
      updated: result.updated,
      changes: result.changes,
      irb_updated: result.irb_updated,
      irb_changes: result.irb_changes,
      skipped: result.skipped,
      skipped_reasons: result.skipped_reasons,
      total_updates: totalUpdates,
      message,
    })
  } catch (error) {
    console.error("Unexpected error in POST /api/research/automate:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET - Check what automation would do (dry run)
export async function GET(request: Request) {
  try {
    const result = await automateStudyStatuses()

    const totalUpdates = result.updated + result.irb_updated
    let message = ""

    if (result.updated > 0 && result.irb_updated > 0) {
      message = `Would update ${result.updated} study status${result.updated !== 1 ? "es" : ""} and ${result.irb_updated} IRB status${result.irb_updated !== 1 ? "es" : ""}`
    } else if (result.updated > 0) {
      message = `Would update ${result.updated} study status${result.updated !== 1 ? "es" : ""}`
    } else if (result.irb_updated > 0) {
      message = `Would update ${result.irb_updated} IRB status${result.irb_updated !== 1 ? "es" : ""}`
    } else {
      message = "No updates needed"
    }

    // Add skipped info to message if any studies would be skipped
    if (result.skipped > 0) {
      message += `. ${result.skipped} stud${result.skipped !== 1 ? "ies" : "y"} would be skipped (IRB not approved)`
    }

    return NextResponse.json({
      success: true,
      would_update: result.updated,
      changes: result.changes,
      would_update_irb: result.irb_updated,
      irb_changes: result.irb_changes,
      would_skip: result.skipped,
      skipped_reasons: result.skipped_reasons,
      total_would_update: totalUpdates,
      message,
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/research/automate:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

