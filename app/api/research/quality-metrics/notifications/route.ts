import { NextResponse } from "next/server"
import { generateQualityMetricNotifications } from "@/lib/quality-metrics-notifications"

// GET - Fetch quality metric notifications
export async function GET() {
  try {
    const { notifications, summary } = await generateQualityMetricNotifications()
    
    return NextResponse.json({
      success: true,
      notifications,
      summary,
      generated_at: new Date().toISOString(),
    })

  } catch (error) {
    console.error("Unexpected error in GET /api/research/quality-metrics/notifications:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

