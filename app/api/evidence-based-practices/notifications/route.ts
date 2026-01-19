import { NextResponse } from "next/server"
import { checkEBPNotifications } from "@/lib/ebp-notifications"

// GET - Get all Evidence-Based Practice notifications
export async function GET(request: Request) {
  try {
    const notifications = await checkEBPNotifications()

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    })
  } catch (error) {
    console.error("Unexpected error in GET /api/evidence-based-practices/notifications:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

