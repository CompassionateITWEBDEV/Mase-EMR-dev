import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(req.url)
    const staffId = searchParams.get("staffId")

    // Fetch all staff with their details
    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id, first_name, last_name, role, department, hire_date, is_active, email")
      .eq("is_active", true)
      .order("last_name")

    if (staffError) throw staffError

    // Fetch training modules
    const { data: modules, error: modulesError } = await supabase
      .from("training_modules")
      .select("*")
      .eq("is_active", true)
      .order("category, name")

    // If modules table doesn't exist, use default modules
    const trainingModules = modules || [
      {
        id: "hipaa",
        module_code: "HIPAA-001",
        name: "HIPAA Privacy & Security",
        description: "Privacy and security of protected health information",
        ceu_hours: 2.0,
        duration_minutes: 120,
        is_required: true,
        frequency: "annual",
        category: "compliance",
        regulatory_source: "HHS/OCR",
        passing_score: 80,
      },
      {
        id: "42cfr",
        module_code: "42CFR-001",
        name: "42 CFR Part 2 Confidentiality",
        description: "Federal regulations protecting SUD patient records",
        ceu_hours: 3.0,
        duration_minutes: 180,
        is_required: true,
        frequency: "annual",
        category: "compliance",
        regulatory_source: "42 CFR Part 2",
        passing_score: 85,
      },
      {
        id: "joint-commission",
        module_code: "JC-001",
        name: "Joint Commission Standards",
        description: "Accreditation standards and survey preparation",
        ceu_hours: 4.0,
        duration_minutes: 240,
        is_required: true,
        frequency: "annual",
        category: "compliance",
        regulatory_source: "Joint Commission",
        passing_score: 80,
      },
      {
        id: "samhsa",
        module_code: "SAMHSA-001",
        name: "SAMHSA OTP Guidelines",
        description: "SAMHSA guidelines for Opioid Treatment Programs",
        ceu_hours: 4.0,
        duration_minutes: 240,
        is_required: true,
        frequency: "annual",
        category: "clinical",
        regulatory_source: "SAMHSA",
        passing_score: 85,
      },
      {
        id: "michigan",
        module_code: "MI-001",
        name: "Michigan State OTP Regulations",
        description: "State of Michigan LARA requirements",
        ceu_hours: 2.5,
        duration_minutes: 150,
        is_required: true,
        frequency: "annual",
        category: "policy",
        regulatory_source: "Michigan LARA",
        passing_score: 80,
      },
      {
        id: "dea",
        module_code: "DEA-001",
        name: "DEA Controlled Substance Regulations",
        description: "DEA requirements for controlled substances",
        ceu_hours: 3.0,
        duration_minutes: 180,
        is_required: true,
        frequency: "annual",
        category: "compliance",
        regulatory_source: "DEA",
        passing_score: 85,
      },
      {
        id: "suicide-prevention",
        module_code: "SP-001",
        name: "Suicide Risk Assessment",
        description: "Columbia Protocol and suicide prevention",
        ceu_hours: 2.0,
        duration_minutes: 120,
        is_required: true,
        frequency: "annual",
        category: "clinical",
        regulatory_source: "Joint Commission",
        passing_score: 85,
      },
      {
        id: "emergency-response",
        module_code: "ER-001",
        name: "Overdose Response & Naloxone",
        description: "Emergency response and Narcan administration",
        ceu_hours: 1.5,
        duration_minutes: 90,
        is_required: true,
        frequency: "biannual",
        category: "safety",
        regulatory_source: "SAMHSA",
        passing_score: 90,
      },
    ]

    // Fetch training completions
    const { data: completions } = await supabase.from("staff_training_completions").select("*")

    // Fetch regulatory updates
    const { data: regulatoryUpdates } = await supabase
      .from("regulatory_updates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10)

    // Build staff education data with completions
    const staffWithTraining =
      staff?.map((member) => {
        const staffCompletions = completions?.filter((c) => c.staff_id === member.id) || []

        const moduleStatus = trainingModules.map((module: any) => {
          const completion = staffCompletions.find(
            (c) => c.module_id === module.id || c.module_id === module.module_code,
          )
          const dueDate = new Date()
          dueDate.setMonth(dueDate.getMonth() + 3) // Default 3 months from now

          return {
            ...module,
            completed: completion?.passed || false,
            completedDate: completion?.completed_at || null,
            certificateNumber: completion?.certificate_number || null,
            certificateExpiresAt: completion?.certificate_expires_at || null,
            ceuHoursEarned: completion?.ceu_hours_earned || 0,
            quizScore: completion?.quiz_score || null,
            progress: completion?.progress_percentage || 0,
            attempts: completion?.attempts || 0,
            dueDate: completion?.certificate_expires_at || dueDate.toISOString(),
          }
        })

        const completedCount = moduleStatus.filter((m) => m.completed).length
        const completionRate = Math.round((completedCount / moduleStatus.length) * 100)
        const totalCeuEarned = moduleStatus.reduce((sum, m) => sum + (m.ceuHoursEarned || 0), 0)
        const totalCeuRequired = moduleStatus.reduce((sum, m) => sum + (m.ceu_hours || 0), 0)

        return {
          ...member,
          training: moduleStatus,
          completionRate,
          completedModules: completedCount,
          totalModules: moduleStatus.length,
          totalCeuEarned,
          totalCeuRequired,
          overdue: moduleStatus.filter((m) => !m.completed && new Date(m.dueDate) < new Date()).length,
          certificates: moduleStatus
            .filter((m) => m.certificateNumber)
            .map((m) => ({
              moduleName: m.name,
              certificateNumber: m.certificateNumber,
              issuedAt: m.completedDate,
              expiresAt: m.certificateExpiresAt,
              ceuHours: m.ceuHoursEarned,
            })),
        }
      }) || []

    // Calculate overall statistics
    const stats = {
      totalStaff: staffWithTraining.length,
      averageCompletion: Math.round(
        staffWithTraining.reduce((sum, s) => sum + s.completionRate, 0) / (staffWithTraining.length || 1),
      ),
      overdueCount: staffWithTraining.reduce((sum, s) => sum + s.overdue, 0),
      fullyCompliant: staffWithTraining.filter((s) => s.completionRate === 100).length,
      totalCeuHoursEarned: staffWithTraining.reduce((sum, s) => sum + s.totalCeuEarned, 0),
      certificatesIssued: staffWithTraining.reduce((sum, s) => sum + s.certificates.length, 0),
    }

    // If specific staff requested, return their data
    if (staffId) {
      const staffMember = staffWithTraining.find((s) => s.id === staffId)
      return NextResponse.json({
        staff: staffMember,
        modules: trainingModules,
        regulatoryUpdates: regulatoryUpdates || [],
      })
    }

    return NextResponse.json({
      staff: staffWithTraining,
      modules: trainingModules,
      regulatoryUpdates: regulatoryUpdates || [],
      stats,
    })
  } catch (error) {
    console.error("Staff education fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch staff education data" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, staffId, moduleId, quizScore, progress } = body
    const supabase = createServiceClient()

    if (action === "start_training") {
      // Record training start
      const { error } = await supabase.from("staff_training_completions").upsert(
        {
          staff_id: staffId,
          module_id: moduleId,
          started_at: new Date().toISOString(),
          progress_percentage: 0,
          attempts: 1,
        },
        { onConflict: "staff_id,module_id" },
      )

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "update_progress") {
      const { error } = await supabase
        .from("staff_training_completions")
        .update({
          progress_percentage: progress,
          updated_at: new Date().toISOString(),
        })
        .match({ staff_id: staffId, module_id: moduleId })

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === "complete_training") {
      // Get module details for CEU hours
      const { data: module } = await supabase
        .from("training_modules")
        .select("ceu_hours, passing_score, name")
        .eq("id", moduleId)
        .single()

      const passingScore = module?.passing_score || 80
      const passed = quizScore >= passingScore
      const certificateNumber = passed
        ? `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        : null
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 1) // Certificate valid for 1 year

      const { error } = await supabase.from("staff_training_completions").upsert(
        {
          staff_id: staffId,
          module_id: moduleId,
          completed_at: new Date().toISOString(),
          progress_percentage: 100,
          quiz_score: quizScore,
          passed,
          certificate_number: certificateNumber,
          certificate_issued_at: passed ? new Date().toISOString() : null,
          certificate_expires_at: passed ? expiryDate.toISOString() : null,
          ceu_hours_earned: passed ? module?.ceu_hours || 0 : 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "staff_id,module_id" },
      )

      if (error) throw error

      // Log to audit trail
      await supabase.from("audit_trail").insert({
        action: "training_completion",
        table_name: "staff_training_completions",
        record_id: staffId,
        new_values: {
          moduleId,
          moduleName: module?.name,
          quizScore,
          passed,
          certificateNumber,
          ceuHours: passed ? module?.ceu_hours : 0,
        },
      })

      return NextResponse.json({
        success: true,
        passed,
        certificateNumber,
        ceuHoursEarned: passed ? module?.ceu_hours : 0,
      })
    }

    if (action === "acknowledge_update") {
      const { updateId } = body
      const { error } = await supabase.from("staff_regulatory_acknowledgments").insert({
        staff_id: staffId,
        update_id: updateId,
      })

      if (error && !error.message.includes("duplicate")) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Staff education update error:", error)
    return NextResponse.json({ error: "Failed to update training status" }, { status: 500 })
  }
}
