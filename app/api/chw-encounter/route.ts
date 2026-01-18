import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const encounterId = searchParams.get("id")

    // Get patients for dropdown
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, first_name, last_name, date_of_birth, phone, address")
      .order("last_name")
      .limit(500)

    if (patientsError) {
      console.error("Error fetching patients:", patientsError)
    }

    // Get CHW staff for dropdown
    const { data: chwStaff, error: staffError } = await supabase
      .from("staff")
      .select("id, first_name, last_name, employee_id")
      .eq("is_active", true)
      .order("last_name")

    if (staffError) {
      console.error("Error fetching staff:", staffError)
    }

    let encounters: any[] = []
    const stats = {
      todayEncounters: 0,
      totalEncounters: 0,
      pendingReferrals: 0,
    }

    try {
      if (encounterId) {
        const { data: encounter } = await supabase
          .from("chw_encounters")
          .select(`
            *,
            patient:patients(id, first_name, last_name, date_of_birth, phone, email, address),
            chw:staff(id, first_name, last_name, employee_id)
          `)
          .eq("id", encounterId)
          .single()

        if (encounter) {
          return NextResponse.json({
            encounter,
            patients: patients || [],
            chwStaff: chwStaff || [],
          })
        }
      }

      // Get all encounters
      const { data: encountersData } = await supabase
        .from("chw_encounters")
        .select(`
          *,
          patient:patients(id, first_name, last_name),
          chw:staff(id, first_name, last_name)
        `)
        .order("encounter_date", { ascending: false })
        .limit(100)

      encounters = encountersData || []

      // Get statistics
      const today = new Date().toISOString().split("T")[0]
      const { count: todayCount } = await supabase
        .from("chw_encounters")
        .select("*", { count: "exact", head: true })
        .eq("encounter_date", today)

      const { count: totalCount } = await supabase.from("chw_encounters").select("*", { count: "exact", head: true })

      stats.todayEncounters = todayCount || 0
      stats.totalEncounters = totalCount || 0

      try {
        const { count: pendingReferrals } = await supabase
          .from("chw_referrals")
          .select("*", { count: "exact", head: true })
          .eq("referral_status", "pending")
        stats.pendingReferrals = pendingReferrals || 0
      } catch {
        // Table might not exist
      }
    } catch (error) {
      // CHW tables might not exist yet - that's OK
      console.log("CHW tables may not exist yet:", error)
    }

    return NextResponse.json({
      encounters,
      chwStaff: chwStaff || [],
      patients: patients || [],
      stats,
    })
  } catch (error) {
    console.error("Error fetching CHW encounters:", error)
    return NextResponse.json({
      encounters: [],
      chwStaff: [],
      patients: [],
      stats: {
        todayEncounters: 0,
        totalEncounters: 0,
        pendingReferrals: 0,
      },
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    // First try to create in chw_encounters
    try {
      const { data: encounter, error: encounterError } = await supabase
        .from("chw_encounters")
        .insert({
          patient_id: body.patient_id,
          chw_id: body.chw_id,
          encounter_date: body.encounter_date,
          encounter_start_time: body.encounter_start_time,
          site_name: body.site_name,
          is_first_visit: body.is_first_visit,
          status: "in_progress",
        })
        .select()
        .single()

      if (encounterError) throw encounterError

      const encounterId = encounter.id

      // Insert all related data
      const insertPromises = []

      if (body.demographics) {
        insertPromises.push(
          supabase.from("chw_encounter_demographics").insert({
            encounter_id: encounterId,
            ...body.demographics,
          }),
        )
      }

      if (body.housing) {
        insertPromises.push(
          supabase.from("chw_housing_assessment").insert({
            encounter_id: encounterId,
            ...body.housing,
          }),
        )
      }

      if (body.food_security) {
        insertPromises.push(
          supabase.from("chw_food_security").insert({
            encounter_id: encounterId,
            ...body.food_security,
          }),
        )
      }

      if (body.transportation) {
        insertPromises.push(
          supabase.from("chw_transportation").insert({
            encounter_id: encounterId,
            ...body.transportation,
          }),
        )
      }

      if (body.utilities) {
        insertPromises.push(
          supabase.from("chw_utilities").insert({
            encounter_id: encounterId,
            ...body.utilities,
          }),
        )
      }

      if (body.employment) {
        insertPromises.push(
          supabase.from("chw_employment").insert({
            encounter_id: encounterId,
            ...body.employment,
          }),
        )
      }

      if (body.family_support) {
        insertPromises.push(
          supabase.from("chw_family_support").insert({
            encounter_id: encounterId,
            ...body.family_support,
          }),
        )
      }

      if (body.mental_health) {
        insertPromises.push(
          supabase.from("chw_mental_health").insert({
            encounter_id: encounterId,
            ...body.mental_health,
          }),
        )
      }

      if (body.healthcare_access) {
        insertPromises.push(
          supabase.from("chw_healthcare_access").insert({
            encounter_id: encounterId,
            ...body.healthcare_access,
          }),
        )
      }

      if (body.health_education) {
        insertPromises.push(
          supabase.from("chw_health_education").insert({
            encounter_id: encounterId,
            ...body.health_education,
          }),
        )
      }

      if (body.referrals && body.referrals.length > 0) {
        const referralsData = body.referrals.map((ref: string) => ({
          encounter_id: encounterId,
          referral_type: ref,
          referral_status: "pending",
        }))
        insertPromises.push(supabase.from("chw_referrals").insert(referralsData))
      }

      await Promise.all(insertPromises)

      // Update encounter status to completed
      await supabase
        .from("chw_encounters")
        .update({
          status: "completed",
          encounter_end_time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        })
        .eq("id", encounterId)

      return NextResponse.json({ success: true, encounterId })
    } catch (tableError) {
      console.log("CHW tables may not exist, storing as progress note:", tableError)

      const noteContent = `
CHW SDOH Screening Encounter
Date: ${body.encounter_date}
Time: ${body.encounter_start_time}
Site: ${body.site_name}
First Visit: ${body.is_first_visit ? "Yes" : "No"}

Demographics:
- Gender: ${body.demographics?.gender || "N/A"}
- Age: ${body.demographics?.age || "N/A"}
- City: ${body.demographics?.city || "N/A"}
- ZIP: ${body.demographics?.zip_code || "N/A"}

Housing: ${body.housing?.living_situation || "Not assessed"}
Food Security: Worry - ${body.food_security?.food_worry_frequency || "N/A"}, Last - ${body.food_security?.food_not_last_frequency || "N/A"}
Transportation: ${body.transportation?.lack_transportation_impact || "N/A"}
Employment: ${body.employment?.employment_help_needed || "N/A"}
Mental Health PHQ-2 Score: ${body.mental_health?.phq2_score || 0}
Healthcare Access: Regular Doctor - ${body.healthcare_access?.has_regular_doctor || "N/A"}

Referrals Made: ${body.referrals?.join(", ") || "None"}
      `.trim()

      const { data: note, error: noteError } = await supabase
        .from("progress_notes")
        .insert({
          patient_id: body.patient_id,
          provider_id: body.chw_id,
          note_type: "CHW_SDOH_Screening",
          content: noteContent,
          status: "final",
        })
        .select()
        .single()

      if (noteError) throw noteError

      return NextResponse.json({ success: true, noteId: note.id, fallback: true })
    }
  } catch (error) {
    console.error("Error creating CHW encounter:", error)
    return NextResponse.json({ error: "Failed to create encounter" }, { status: 500 })
  }
}
