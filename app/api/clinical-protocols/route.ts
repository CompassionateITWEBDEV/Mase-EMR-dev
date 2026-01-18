import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch all data in parallel
    const [
      { data: protocols, error: protocolsError },
      { data: cowsAssessments, error: cowsError },
      { data: ciwaAssessments, error: ciwaError },
      { data: vitalSigns, error: vitalsError },
      { data: patients, error: patientsError },
    ] = await Promise.all([
      supabase.from("clinical_protocols").select("*").order("created_at", { ascending: false }),
      supabase
        .from("cows_assessments")
        .select("*, patients(first_name, last_name)")
        .order("assessment_date", { ascending: false })
        .limit(50),
      supabase
        .from("ciwa_assessments")
        .select("*, patients(first_name, last_name)")
        .order("assessment_date", { ascending: false })
        .limit(50),
      supabase
        .from("vital_signs")
        .select("*, patients(first_name, last_name)")
        .order("measurement_date", { ascending: false })
        .limit(50),
      supabase.from("patients").select("id, first_name, last_name").limit(100),
    ])

    if (protocolsError) console.error("Protocols error:", protocolsError)
    if (cowsError) console.error("COWS error:", cowsError)
    if (ciwaError) console.error("CIWA error:", ciwaError)
    if (vitalsError) console.error("Vitals error:", vitalsError)

    // Calculate stats
    const today = new Date().toISOString().split("T")[0]
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const cowsThisWeek = (cowsAssessments || []).filter((a) => new Date(a.assessment_date) >= new Date(weekAgo)).length

    const ciwaThisWeek = (ciwaAssessments || []).filter((a) => new Date(a.assessment_date) >= new Date(weekAgo)).length

    const vitalsToday = (vitalSigns || []).filter(
      (v) => v.measurement_date && v.measurement_date.split("T")[0] === today,
    ).length

    const avgHeartRate =
      vitalSigns && vitalSigns.length > 0
        ? Math.round(vitalSigns.reduce((sum, v) => sum + (v.heart_rate || 0), 0) / vitalSigns.length)
        : 0

    return NextResponse.json({
      protocols: protocols || [],
      cowsAssessments: (cowsAssessments || []).map((a) => ({
        id: a.id,
        patientName: a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : "Unknown",
        patientId: a.patient_id,
        totalScore: a.total_score,
        severityLevel: a.severity_level,
        assessmentDate: a.assessment_date,
        providerId: a.provider_id,
        notes: a.notes,
        // Individual scores
        restingPulseRate: a.resting_pulse_rate,
        sweating: a.sweating,
        restlessness: a.restlessness,
        pupilSize: a.pupil_size,
        boneJointAches: a.bone_joint_aches,
        runnyNoseTearing: a.runny_nose_tearing,
        giUpset: a.gi_upset,
        tremor: a.tremor,
        yawning: a.yawning,
        anxietyIrritability: a.anxiety_irritability,
        goosefleshSkin: a.gooseflesh_skin,
      })),
      ciwaAssessments: (ciwaAssessments || []).map((a) => ({
        id: a.id,
        patientName: a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : "Unknown",
        patientId: a.patient_id,
        totalScore: a.total_score,
        severityLevel: a.severity_level,
        assessmentDate: a.assessment_date,
        providerId: a.provider_id,
        notes: a.notes,
        // Individual scores
        nauseaVomiting: a.nausea_vomiting,
        tremor: a.tremor,
        paroxysmalSweats: a.paroxysmal_sweats,
        anxiety: a.anxiety,
        agitation: a.agitation,
        tactileDisturbances: a.tactile_disturbances,
        auditoryDisturbances: a.auditory_disturbances,
        visualDisturbances: a.visual_disturbances,
        headacheFullness: a.headache_fullness,
        orientation: a.orientation,
      })),
      vitalSigns: (vitalSigns || []).map((v) => ({
        id: v.id,
        patientName: v.patients ? `${v.patients.first_name} ${v.patients.last_name}` : "Unknown",
        patientId: v.patient_id,
        systolicBp: v.systolic_bp,
        diastolicBp: v.diastolic_bp,
        heartRate: v.heart_rate,
        respiratoryRate: v.respiratory_rate,
        temperature: v.temperature,
        oxygenSaturation: v.oxygen_saturation,
        weight: v.weight,
        painScale: v.pain_scale,
        measurementDate: v.measurement_date,
        notes: v.notes,
      })),
      patients: patients || [],
      stats: {
        cowsThisWeek,
        ciwaThisWeek,
        vitalsToday,
        avgHeartRate,
      },
    })
  } catch (error) {
    console.error("Clinical protocols API error:", error)
    return NextResponse.json({ error: "Failed to fetch clinical protocols data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { type, data } = body

    if (type === "cows") {
      // Calculate total score and severity
      const scores = [
        data.restingPulseRate || 0,
        data.sweating || 0,
        data.restlessness || 0,
        data.pupilSize || 0,
        data.boneJointAches || 0,
        data.runnyNoseTearing || 0,
        data.giUpset || 0,
        data.tremor || 0,
        data.yawning || 0,
        data.anxietyIrritability || 0,
        data.goosefleshSkin || 0,
      ]
      const totalScore = scores.reduce((sum, s) => sum + s, 0)
      const severityLevel =
        totalScore <= 12 ? "Mild" : totalScore <= 24 ? "Moderate" : totalScore <= 36 ? "Moderately Severe" : "Severe"

      const { error } = await supabase.from("cows_assessments").insert({
        patient_id: data.patientId,
        provider_id: data.providerId || null,
        assessment_date: new Date().toISOString(),
        resting_pulse_rate: data.restingPulseRate,
        sweating: data.sweating,
        restlessness: data.restlessness,
        pupil_size: data.pupilSize,
        bone_joint_aches: data.boneJointAches,
        runny_nose_tearing: data.runnyNoseTearing,
        gi_upset: data.giUpset,
        tremor: data.tremor,
        yawning: data.yawning,
        anxiety_irritability: data.anxietyIrritability,
        gooseflesh_skin: data.goosefleshSkin,
        total_score: totalScore,
        severity_level: severityLevel,
        notes: data.notes,
      })

      if (error) throw error
      return NextResponse.json({ success: true, totalScore, severityLevel })
    }

    if (type === "ciwa") {
      const scores = [
        data.nauseaVomiting || 0,
        data.tremor || 0,
        data.paroxysmalSweats || 0,
        data.anxiety || 0,
        data.agitation || 0,
        data.tactileDisturbances || 0,
        data.auditoryDisturbances || 0,
        data.visualDisturbances || 0,
        data.headacheFullness || 0,
        data.orientation || 0,
      ]
      const totalScore = scores.reduce((sum, s) => sum + s, 0)
      const severityLevel = totalScore <= 9 ? "Minimal" : totalScore <= 15 ? "Mild to Moderate" : "Severe"

      const { error } = await supabase.from("ciwa_assessments").insert({
        patient_id: data.patientId,
        provider_id: data.providerId || null,
        assessment_date: new Date().toISOString(),
        nausea_vomiting: data.nauseaVomiting,
        tremor: data.tremor,
        paroxysmal_sweats: data.paroxysmalSweats,
        anxiety: data.anxiety,
        agitation: data.agitation,
        tactile_disturbances: data.tactileDisturbances,
        auditory_disturbances: data.auditoryDisturbances,
        visual_disturbances: data.visualDisturbances,
        headache_fullness: data.headacheFullness,
        orientation: data.orientation,
        total_score: totalScore,
        severity_level: severityLevel,
        notes: data.notes,
      })

      if (error) throw error
      return NextResponse.json({ success: true, totalScore, severityLevel })
    }

    if (type === "vitals") {
      const { error } = await supabase.from("vital_signs").insert({
        patient_id: data.patientId,
        provider_id: data.providerId || null,
        measurement_date: new Date().toISOString(),
        systolic_bp: data.systolicBp ? Number.parseInt(data.systolicBp) : null,
        diastolic_bp: data.diastolicBp ? Number.parseInt(data.diastolicBp) : null,
        heart_rate: data.heartRate ? Number.parseInt(data.heartRate) : null,
        respiratory_rate: data.respiratoryRate ? Number.parseInt(data.respiratoryRate) : null,
        temperature: data.temperature ? Number.parseFloat(data.temperature) : null,
        oxygen_saturation: data.oxygenSaturation ? Number.parseInt(data.oxygenSaturation) : null,
        weight: data.weight ? Number.parseFloat(data.weight) : null,
        pain_scale: data.painScale ? Number.parseInt(data.painScale) : null,
        notes: data.notes,
      })

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (type === "protocol") {
      const { error } = await supabase.from("clinical_protocols").insert({
        name: data.name,
        category: data.category,
        description: data.description,
        frequency: data.frequency,
        protocol_steps: data.protocolSteps || [],
        triggers: data.triggers || {},
        is_active: true,
      })

      if (error) throw error
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("Clinical protocols POST error:", error)
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { id, data } = body

    const { error } = await supabase
      .from("clinical_protocols")
      .update({
        name: data.name,
        category: data.category,
        description: data.description,
        frequency: data.frequency,
        protocol_steps: data.protocolSteps,
        triggers: data.triggers,
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Clinical protocols PUT error:", error)
    return NextResponse.json({ error: "Failed to update protocol" }, { status: 500 })
  }
}
