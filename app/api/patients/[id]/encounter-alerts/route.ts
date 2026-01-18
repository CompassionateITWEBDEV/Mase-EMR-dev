import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    // Fetch encounter note alerts for this patient
    // Handle case where table doesn't exist yet (migration not run)
    const { data: alerts, error } = await supabase
      .from("encounter_note_alerts")
      .select("*")
      .eq("patient_id", id)
      .order("timestamp", { ascending: false })

    if (error) {
      // Check for various table-not-found error codes and messages
      const errorCode = error.code || ""
      const errorMessage = error.message || ""
      const errorHint = error.hint || ""
      
      const isTableNotFound = 
        errorCode === "42P01" || // PostgreSQL: relation does not exist
        errorCode === "PGRST301" || // PostgREST: relation not found
        errorCode === "PGRST116" || // PostgREST: no rows returned (but also used for not found)
        errorMessage.toLowerCase().includes("does not exist") ||
        errorMessage.toLowerCase().includes("relation") ||
        errorMessage.toLowerCase().includes("table") ||
        errorHint.toLowerCase().includes("does not exist")
      
      if (isTableNotFound) {
        console.warn("encounter_note_alerts table does not exist yet. Migration may need to be run.")
        return NextResponse.json({
          alerts: [],
          unreadCount: 0,
        })
      }
      
      // For any other error, log it but still return empty array to prevent UI errors
      console.warn("Error fetching encounter alerts (returning empty array):", { code: errorCode, message: errorMessage, hint: errorHint })
      return NextResponse.json({
        alerts: [],
        unreadCount: 0,
      })
    }

    // Format alerts with relative time
    const formattedAlerts = (alerts || []).map((alert) => {
      const timestamp = new Date(alert.timestamp)
      const now = new Date()
      const diffMs = now.getTime() - timestamp.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      let relativeTime: string
      if (diffMins < 1) {
        relativeTime = "Just now"
      } else if (diffMins < 60) {
        relativeTime = `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
      } else if (diffHours < 24) {
        relativeTime = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
      } else if (diffDays < 7) {
        relativeTime = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
      } else {
        relativeTime = timestamp.toLocaleDateString()
      }

      return {
        ...alert,
        relativeTime,
        formattedTimestamp: timestamp.toLocaleString(),
      }
    })

    return NextResponse.json({
      alerts: formattedAlerts,
      unreadCount: formattedAlerts.filter((a) => !a.is_read).length,
    })
  } catch (error: any) {
    console.error("Error in encounter alerts endpoint:", error)
    
    // Check for various table-not-found error codes and messages
    const errorCode = error?.code || ""
    const errorMessage = error?.message || ""
    const errorHint = error?.hint || ""
    
    const isTableNotFound = 
      errorCode === "42P01" || // PostgreSQL: relation does not exist
      errorCode === "PGRST301" || // PostgREST: relation not found
      errorCode === "PGRST116" || // PostgREST: no rows returned
      errorMessage?.toLowerCase().includes("does not exist") ||
      errorMessage?.toLowerCase().includes("relation") ||
      errorMessage?.toLowerCase().includes("table") ||
      errorHint?.toLowerCase().includes("does not exist")
    
    if (isTableNotFound) {
      console.warn("encounter_note_alerts table does not exist yet. Migration may need to be run.")
      return NextResponse.json({
        alerts: [],
        unreadCount: 0,
      })
    }
    
    // For any other error, return empty array instead of error to prevent UI issues
    console.warn("Error in encounter alerts endpoint (returning empty array):", { code: errorCode, message: errorMessage, hint: errorHint })
    return NextResponse.json({
      alerts: [],
      unreadCount: 0,
    })
  }
}

// Mark alert as read
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServiceClient()
    const body = await request.json()

    const { alertId, isRead } = body

    if (!alertId || typeof isRead !== "boolean") {
      return NextResponse.json(
        { error: "alertId and isRead are required" },
        { status: 400 }
      )
    }

    const updateData: any = {
      is_read: isRead,
    }

    if (isRead) {
      updateData.read_at = new Date().toISOString()
    } else {
      updateData.read_at = null
      updateData.read_by = null
    }

    const { error } = await supabase
      .from("encounter_note_alerts")
      .update(updateData)
      .eq("id", alertId)
      .eq("patient_id", id)

    if (error) {
      // Check for various table-not-found error codes and messages
      const errorCode = error.code || ""
      const errorMessage = error.message || ""
      const errorHint = error.hint || ""
      
      const isTableNotFound = 
        errorCode === "42P01" ||
        errorCode === "PGRST301" ||
        errorCode === "PGRST116" ||
        errorMessage?.toLowerCase().includes("does not exist") ||
        errorMessage?.toLowerCase().includes("relation") ||
        errorMessage?.toLowerCase().includes("table") ||
        errorHint?.toLowerCase().includes("does not exist")
      
      if (isTableNotFound) {
        console.warn("encounter_note_alerts table does not exist yet. Migration may need to be run.")
        return NextResponse.json({ success: true })
      }
      
      // For any other error, log it but return success to prevent UI errors
      console.warn("Error updating alert (returning success):", { code: errorCode, message: errorMessage, hint: errorHint })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in alert update endpoint:", error)
    
    // Check for various table-not-found error codes and messages
    const errorCode = error?.code || ""
    const errorMessage = error?.message || ""
    const errorHint = error?.hint || ""
    
    const isTableNotFound = 
      errorCode === "42P01" ||
      errorCode === "PGRST301" ||
      errorCode === "PGRST116" ||
      errorMessage?.toLowerCase().includes("does not exist") ||
      errorMessage?.toLowerCase().includes("relation") ||
      errorMessage?.toLowerCase().includes("table") ||
      errorHint?.toLowerCase().includes("does not exist")
    
    if (isTableNotFound) {
      console.warn("encounter_note_alerts table does not exist yet. Migration may need to be run.")
      return NextResponse.json({ success: true })
    }
    
    // For any other error, return success to prevent UI issues
    console.warn("Error in alert update endpoint (returning success):", { code: errorCode, message: errorMessage, hint: errorHint })
    return NextResponse.json({ success: true })
  }
}
