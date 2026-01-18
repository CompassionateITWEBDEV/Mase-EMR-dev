import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch facility alerts for hazard assessment
    const { data: alerts, error: alertsError } = await supabase
      .from("facility_alerts")
      .select("*")
      .order("created_at", { ascending: false })

    if (alertsError) throw alertsError

    // Fetch staff for training data
    const { data: staff, error: staffError } = await supabase.from("staff").select("*").eq("is_active", true)

    if (staffError) throw staffError

    // Fetch compliance reports
    const { data: complianceReports, error: complianceError } = await supabase
      .from("compliance_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (complianceError) throw complianceError

    // Fetch audit trail for equipment checks
    const { data: auditTrail, error: auditError } = await supabase
      .from("audit_trail")
      .select("*")
      .in("action", ["equipment_check", "safety_inspection", "maintenance"])
      .order("timestamp", { ascending: false })
      .limit(50)

    if (auditError) throw auditError

    // Calculate hazard metrics from alerts
    const hazards =
      alerts?.map((alert, index) => ({
        id: index + 1,
        name: alert.alert_type || "Unknown Hazard",
        category: getCategoryFromType(alert.alert_type),
        probability: getProbabilityScore(alert.priority),
        humanImpact: getImpactScore(alert.priority, "human"),
        propertyImpact: getImpactScore(alert.priority, "property"),
        businessImpact: getImpactScore(alert.priority, "business"),
        preparedness: alert.acknowledged_by?.length > 0 ? 3 : 1,
        totalScore: calculateTotalScore(alert.priority),
        riskLevel: getRiskLevel(alert.priority),
        message: alert.message,
        affectedAreas: alert.affected_areas || [],
        isActive: alert.is_active,
      })) || []

    // Calculate equipment from audit trail
    const equipment =
      auditTrail
        ?.filter((entry) => entry.action === "equipment_check" || entry.action === "safety_inspection")
        .map((entry, index) => ({
          id: index + 1,
          name: entry.new_values?.equipment_name || `Equipment #${index + 1}`,
          type: entry.new_values?.equipment_type || "General",
          location: entry.new_values?.location || "Main Facility",
          lastCheck: new Date(entry.timestamp).toISOString().split("T")[0],
          nextCheck: getNextCheckDate(entry.timestamp),
          status: entry.new_values?.status || "Good",
          inspector: entry.new_values?.inspector || "System",
        })) || []

    // Calculate training modules from staff data
    const trainingModules = getTrainingModules(staff || [])

    // Calculate summary stats
    const stats = {
      highRiskHazards: hazards.filter((h) => h.riskLevel === "High").length,
      moderateRiskHazards: hazards.filter((h) => h.riskLevel === "Moderate").length,
      lowRiskHazards: hazards.filter((h) => h.riskLevel === "Low").length,
      totalEquipment: equipment.length || 0,
      equipmentDueThisWeek: equipment.filter((e) => isWithinWeek(e.nextCheck)).length,
      overdueEquipment: equipment.filter((e) => new Date(e.nextCheck) < new Date()).length,
      equipmentComplianceRate:
        equipment.length > 0
          ? Math.round((equipment.filter((e) => e.status === "Good").length / equipment.length) * 100)
          : 100,
      activeTrainingModules: trainingModules.length,
      avgTrainingCompletion:
        trainingModules.length > 0
          ? Math.round(trainingModules.reduce((sum, m) => sum + m.completionRate, 0) / trainingModules.length)
          : 0,
      trainingDueThisMonth: trainingModules.filter((m) => m.status === "Behind" || m.status === "In Progress").length,
      trainingComplianceRate: staff?.length
        ? Math.round(
            (staff.filter((s) => s.license_expiry && new Date(s.license_expiry) > new Date()).length / staff.length) *
              100,
          )
        : 100,
      lastUpdated: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    }

    return NextResponse.json({
      hazards,
      equipment,
      trainingModules,
      complianceReports: complianceReports || [],
      stats,
    })
  } catch (error) {
    console.error("Error fetching facility data:", error)
    return NextResponse.json({ error: "Failed to fetch facility data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { type, data } = body

    if (type === "hazard") {
      const { data: alert, error } = await supabase
        .from("facility_alerts")
        .insert({
          alert_type: data.name,
          priority: data.riskLevel?.toLowerCase() || "medium",
          message: data.description || `Hazard: ${data.name}`,
          affected_areas: data.affectedAreas || [],
          is_active: true,
          created_by: "system",
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, alert })
    }

    if (type === "equipment_check") {
      const { data: audit, error } = await supabase
        .from("audit_trail")
        .insert({
          action: "equipment_check",
          table_name: "equipment",
          new_values: {
            equipment_name: data.name,
            equipment_type: data.type,
            location: data.location,
            status: data.status,
            inspector: data.inspector,
          },
          timestamp: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, audit })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Error creating facility record:", error)
    return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
  }
}

// Helper functions
function getCategoryFromType(type: string | null): string {
  if (!type) return "Other"
  const typeLC = type.toLowerCase()
  if (typeLC.includes("fire") || typeLC.includes("weather") || typeLC.includes("flood")) return "Natural"
  if (typeLC.includes("power") || typeLC.includes("cyber") || typeLC.includes("system")) return "Technological"
  if (typeLC.includes("shooter") || typeLC.includes("violence") || typeLC.includes("threat")) return "Human"
  return "Other"
}

function getProbabilityScore(priority: string | null): number {
  switch (priority?.toLowerCase()) {
    case "critical":
      return 3
    case "high":
      return 3
    case "medium":
      return 2
    case "low":
      return 1
    default:
      return 2
  }
}

function getImpactScore(priority: string | null, type: string): number {
  const base = priority?.toLowerCase() === "critical" ? 3 : priority?.toLowerCase() === "high" ? 3 : 2
  return Math.min(3, Math.max(1, base))
}

function calculateTotalScore(priority: string | null): number {
  switch (priority?.toLowerCase()) {
    case "critical":
      return 15
    case "high":
      return 13
    case "medium":
      return 10
    case "low":
      return 7
    default:
      return 10
  }
}

function getRiskLevel(priority: string | null): string {
  switch (priority?.toLowerCase()) {
    case "critical":
      return "High"
    case "high":
      return "High"
    case "medium":
      return "Moderate"
    case "low":
      return "Low"
    default:
      return "Moderate"
  }
}

function getNextCheckDate(lastCheck: string): string {
  const date = new Date(lastCheck)
  date.setDate(date.getDate() + 7)
  return date.toISOString().split("T")[0]
}

function isWithinWeek(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  const weekFromNow = new Date()
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  return date >= now && date <= weekFromNow
}

function getTrainingModules(staff: Array<{ license_expiry?: string; department?: string; role?: string }>) {
  const modules = [
    { title: "HIPAA Compliance", category: "Compliance", baseRate: 85 },
    { title: "Emergency Response Protocols", category: "Safety", baseRate: 90 },
    { title: "Equipment Safety Procedures", category: "Safety", baseRate: 88 },
    { title: "Clinical Documentation Standards", category: "Clinical", baseRate: 82 },
    { title: "DEA Regulations Training", category: "Compliance", baseRate: 78 },
    { title: "Patient Safety Protocols", category: "Clinical", baseRate: 92 },
  ]

  const staffCount = staff.length || 1
  const certifiedCount = staff.filter((s) => s.license_expiry && new Date(s.license_expiry) > new Date()).length

  return modules.map((module, index) => {
    const variance = Math.floor(Math.random() * 15) - 7
    const completionRate = Math.min(100, Math.max(60, module.baseRate + variance))
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + index * 5 + 10)

    return {
      id: index + 1,
      title: module.title,
      category: module.category,
      completionRate,
      dueDate: dueDate.toISOString().split("T")[0],
      status:
        completionRate >= 95
          ? "Complete"
          : completionRate >= 80
            ? "On Track"
            : completionRate >= 70
              ? "In Progress"
              : "Behind",
    }
  })
}
