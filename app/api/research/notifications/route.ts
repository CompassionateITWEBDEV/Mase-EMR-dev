import { NextResponse } from "next/server"
import { checkResearchNotifications } from "@/lib/research-notifications"

// GET - Get all research study notifications
export async function GET(request: Request) {
  try {
    const notifications = await checkResearchNotifications()

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/research/notifications:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

