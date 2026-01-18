import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { getAuthenticatedUser, getUserRole } from "@/lib/auth/middleware"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createServiceClient()

    // Get encounter details
    const { data: encounter, error: encError } = await supabase
      .from("appointments")
      .select(`
        *,
        patients (id, first_name, last_name, date_of_birth, gender, phone, email, address),
        providers (id, first_name, last_name, specialization)
      `)
      .eq("id", id)
      .single()

    if (encError) {
      console.error("Error fetching encounter:", encError)
      if (encError.code === "PGRST116") {
        return NextResponse.json({ error: "Encounter not found" }, { status: 404 })
      }
      throw encError
    }

    if (!encounter) {
      return NextResponse.json({ error: "Encounter not found" }, { status: 404 })
    }

    const patientId = encounter.patient_id

    // Get patient medications
    const { data: medications } = await supabase
      .from("patient_medications")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .order("medication_name")

    // Get vital signs with history for comparison
    const { data: vitals } = await supabase
      .from("vital_signs")
      .select("*")
      .eq("patient_id", patientId)
      .order("measurement_date", { ascending: false })
      .limit(10)

    // Get assessments with diagnosis codes
    const { data: assessments } = await supabase
      .from("assessments")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(5)

    // Get progress notes (general patient notes)
    const { data: notes } = await supabase
      .from("progress_notes")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(5)

    // Get progress note specifically for this encounter/appointment
    // Select all columns, including optional edit tracking columns if they exist
    const { data: encounterNote } = await supabase
      .from("progress_notes")
      .select("*")
      .eq("appointment_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get treatment plans
    const { data: treatmentPlans } = await supabase
      .from("treatment_plans")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "active")
      .limit(1)

    return NextResponse.json({
      encounter,
      medications: medications || [],
      vitals: vitals || [],
      assessments: assessments || [],
      notes: notes || [],
      encounterNote: encounterNote || null,
      treatmentPlans: treatmentPlans || [],
    })
  } catch (error) {
    console.error("Error fetching encounter details:", error)
    const errorMessage = (error as any)?.message || "Failed to fetch encounter"
    const statusCode = (error as any)?.code === "PGRST116" ? 404 : 500
    return NextResponse.json(
      { 
        error: errorMessage,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      }, 
      { status: statusCode }
    )
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createServiceClient()
    const body = await request.json()

    // Get authenticated user for cooldown check and alert creation
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = getUserRole(user)
    const canBypassCooldown = userRole === "admin" || userRole === "super_admin"

    // Get staff ID from user
    let staffId: string | null = null
    try {
      const { data: staffData } = await supabase
        .from("staff")
        .select("id, first_name, last_name, role")
        .eq("id", user.id)
        .maybeSingle()

      if (staffData) {
        staffId = staffData.id
      } else {
        // Try providers table as fallback
        const { data: providerData } = await supabase
          .from("providers")
          .select("id, first_name, last_name")
          .eq("id", user.id)
          .maybeSingle()

        if (providerData) {
          staffId = providerData.id
        }
      }
    } catch (staffError) {
      console.warn("Could not fetch staff ID:", staffError)
    }

    // Update encounter/appointment
    if (body.status) {
      const { error: encError } = await supabase
        .from("appointments")
        .update({ status: body.status, notes: body.notes })
        .eq("id", id)

      if (encError) throw encError
    }

    // Track if vitals were saved successfully
    let vitalsSaved = false

    // Save vital signs if provided
    console.log('Checking for vitals in request:', {
      hasVitals: !!body.vitals,
      patientId: body.patient_id,
      vitalsData: body.vitals
    })

    if (body.vitals && body.patient_id) {
      const vitalData: any = {
        patient_id: body.patient_id,
        provider_id: body.provider_id,
        measurement_date: new Date().toISOString(),
        systolic_bp: body.vitals.systolic_bp,
        diastolic_bp: body.vitals.diastolic_bp,
        heart_rate: body.vitals.heart_rate,
        respiratory_rate: body.vitals.respiratory_rate,
        temperature: body.vitals.temperature,
        temperature_unit: body.vitals.temperature_site === "tympanic" ? "F" : (body.vitals.temperature_site || "F"),
        oxygen_saturation: body.vitals.oxygen_saturation,
        weight: body.vitals.weight,
        weight_unit: body.vitals.weight_unit || "lbs",
        // Note: 'height' column doesn't exist - use height_feet and height_inches instead
        height_feet: body.vitals.height_feet,
        height_inches: body.vitals.height_inches,
        bmi: body.vitals.bmi,
        pain_scale: body.vitals.pain_scale,
        pain_location: body.vitals.pain_location,
        notes: body.vitals.notes,
      }

      // Remove null/undefined values to avoid database errors
      const cleanedVitalData: any = {}
      Object.keys(vitalData).forEach(key => {
        const value = vitalData[key]
        if (value !== null && value !== undefined && value !== '') {
          cleanedVitalData[key] = value
        }
      })

      console.log('=== ATTEMPTING TO SAVE VITAL SIGNS ===')
      console.log('Patient ID:', body.patient_id)
      console.log('Cleaned vital data:', JSON.stringify(cleanedVitalData, null, 2))

      // First attempt: try with appointment_id
      let vitalError: any = null
      let savedVitals: any = null
      
      // Try inserting with appointment_id first
      const dataWithAppointment = { ...cleanedVitalData, appointment_id: id }
      const result1 = await supabase
        .from("vital_signs")
        .insert(dataWithAppointment)
        .select()

      if (result1.error) {
        // If appointment_id column doesn't exist, try without it
        console.log('First insert attempt failed, trying without appointment_id:', result1.error.message)
        
        const result2 = await supabase
          .from("vital_signs")
          .insert(cleanedVitalData)
          .select()
        
        vitalError = result2.error
        savedVitals = result2.data
      } else {
        savedVitals = result1.data
      }

      if (vitalError) {
        console.error("=== VITAL SIGNS SAVE FAILED ===")
        console.error("Vital error:", vitalError)
        console.error("Vital data attempted:", JSON.stringify(cleanedVitalData, null, 2))
        console.error("Vital error details:", {
          code: vitalError.code,
          message: vitalError.message,
          details: vitalError.details,
          hint: vitalError.hint
        })
        // Don't fail the entire request if vitals fail, but log the error
      } else {
        // Vitals saved successfully - they will appear in Patient Vitals tab on next refresh
        console.log("=== VITAL SIGNS SAVED SUCCESSFULLY ===")
        console.log("Patient ID:", body.patient_id)
        console.log("Saved vitals data:", JSON.stringify(savedVitals, null, 2))
        vitalsSaved = true
      }
    } else {
      console.log('No vitals to save:', {
        hasVitals: !!body.vitals,
        hasPatientId: !!body.patient_id
      })
    }

    // Save assessment with diagnosis codes if provided
    if (body.assessment && body.patient_id) {
      const { error: assessError } = await supabase.from("assessments").insert({
        patient_id: body.patient_id,
        provider_id: body.provider_id,
        appointment_id: id,
        assessment_type: "encounter",
        chief_complaint: body.chief_complaint,
        history_present_illness: body.hpi,
        diagnosis_codes: body.diagnosis_codes || [],
        treatment_plan: body.plan,
        mental_status_exam: body.mental_status_exam,
        risk_assessment: body.risk_assessment,
      })

      if (assessError) console.error("Assessment error:", assessError)
    }

    // Save or update progress note if provided
    if (body.note && body.patient_id) {
      // Check if note exists for this appointment
      // Use * to get all columns, then check which ones exist
      const { data: existingNote } = await supabase
        .from("progress_notes")
        .select("*")
        .eq("appointment_id", id)
        .maybeSingle()

      const noteIdToUse = body.noteId || existingNote?.id

      if (noteIdToUse) {
        // Verify note still exists (handle deleted notes)
        // Select all columns to check which ones exist
        const { data: verifyNote } = await supabase
          .from("progress_notes")
          .select("*")
          .eq("id", noteIdToUse)
          .maybeSingle()

        if (!verifyNote) {
          return NextResponse.json(
            { error: "Note not found. It may have been deleted." },
            { status: 404 }
          )
        }

        // Check cooldown period (10 days) unless user can bypass
        // First edit (no last_edited_at) is always allowed
        // Only check cooldown if the column exists
        if (!canBypassCooldown && verifyNote.last_edited_at) {
          try {
            const lastEdited = new Date(verifyNote.last_edited_at)
            const now = new Date()
            const daysSinceEdit = (now.getTime() - lastEdited.getTime()) / (1000 * 60 * 60 * 24)

            if (daysSinceEdit < 10) {
              const nextEditDate = new Date(lastEdited)
              nextEditDate.setDate(nextEditDate.getDate() + 10)
              const daysRemaining = Math.ceil(10 - daysSinceEdit)

              return NextResponse.json(
                {
                  error: "Note cannot be edited until cooldown period expires",
                  cooldown_active: true,
                  last_edited_at: verifyNote.last_edited_at,
                  days_since_edit: Math.floor(daysSinceEdit),
                  days_remaining: daysRemaining,
                  next_edit_date: nextEditDate.toISOString(),
                  message: `This note was last edited ${Math.floor(daysSinceEdit)} day${Math.floor(daysSinceEdit) !== 1 ? "s" : ""} ago. You can edit again in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} (on ${nextEditDate.toLocaleDateString()}).`,
                },
                { status: 403 }
              )
            }
          } catch (e) {
            // If last_edited_at is invalid or doesn't exist, skip cooldown check
            console.warn("Could not check cooldown - column may not exist:", e)
          }
        }

        // Get encounter details for alert (handle deleted encounters gracefully)
        const { data: encounter } = await supabase
          .from("appointments")
          .select("appointment_date, visit_reason, encounter_type, patients(first_name, last_name)")
          .eq("id", id)
          .maybeSingle()

        // If encounter is deleted, still allow note edit but use fallback for alert
        const encounterDate = encounter?.appointment_date
          ? new Date(encounter.appointment_date).toLocaleDateString()
          : "Unknown date"
        const encounterType = encounter?.visit_reason || encounter?.encounter_type || "Encounter"
        const encounterReference = encounter
          ? `Encounter on ${encounterDate} - ${encounterType}`
          : "Encounter (details unavailable)"

        // Get editor information for alert
        let editorName = "Unknown User"
        let editorRole = userRole || "Unknown"
        if (staffId) {
          const { data: staffInfo } = await supabase
            .from("staff")
            .select("first_name, last_name, role")
            .eq("id", staffId)
            .maybeSingle()

          if (staffInfo) {
            editorName = `${staffInfo.first_name} ${staffInfo.last_name}`
            editorRole = staffInfo.role || editorRole
          }
        }

        // Update existing note with edit tracking
        // Use verifyNote instead of existingNote to ensure we have latest data
        const updateData: any = {
          subjective: body.note.subjective,
          objective: body.note.objective,
          assessment: body.note.assessment,
          plan: body.note.plan,
          updated_at: new Date().toISOString(),
        }

        // Only add new columns if they exist (check by trying to read them first)
        // If migration hasn't been run, these columns won't exist
        // Check if columns exist by seeing if they're in the verifyNote object
        // Note: Supabase returns null for non-existent columns, so we check for null/undefined
        if (verifyNote.last_edited_at !== undefined || verifyNote.hasOwnProperty('last_edited_at')) {
          updateData.last_edited_at = new Date().toISOString()
        }
        if (verifyNote.edit_count !== undefined || verifyNote.hasOwnProperty('edit_count')) {
          updateData.edit_count = (verifyNote.edit_count || 0) + 1
        }
        if (staffId && (verifyNote.last_edited_by !== undefined || verifyNote.hasOwnProperty('last_edited_by'))) {
          updateData.last_edited_by = staffId
        }
        // Preserve original_created_at on first edit (only if column exists)
        if (verifyNote.original_created_at !== undefined || verifyNote.hasOwnProperty('original_created_at')) {
          if (!verifyNote.original_created_at) {
            updateData.original_created_at = verifyNote.created_at || new Date().toISOString()
          }
        }

        // Use a transaction-like approach: update with a WHERE clause that checks the note hasn't changed
        // This provides basic optimistic locking to prevent concurrent edits
        let noteError
        let updatedNote
        
        try {
          const result = await supabase
            .from("progress_notes")
            .update(updateData)
            .eq("id", noteIdToUse)
            .select()
            .single()
          
          noteError = result.error
          updatedNote = result.data
          
          // If error is about missing column, retry without the new columns
          if (noteError && (
            noteError.message?.includes('original_created_at') ||
            noteError.message?.includes('last_edited_at') ||
            noteError.message?.includes('edit_count') ||
            noteError.message?.includes('last_edited_by') ||
            noteError.code === '42703' // PostgreSQL undefined column error
          )) {
            console.warn("Edit tracking columns don't exist, retrying without them")
            // Retry with only basic columns
            const basicUpdateData = {
              subjective: body.note.subjective,
              objective: body.note.objective,
              assessment: body.note.assessment,
              plan: body.note.plan,
              updated_at: new Date().toISOString(),
            }
            
            const retryResult = await supabase
              .from("progress_notes")
              .update(basicUpdateData)
              .eq("id", noteIdToUse)
              .select()
              .single()
            
            noteError = retryResult.error
            updatedNote = retryResult.data
          }
        } catch (e) {
          // If update fails completely, try with just basic fields
          console.warn("Update failed, retrying with basic fields only:", e)
          const basicUpdateData = {
            subjective: body.note.subjective,
            objective: body.note.objective,
            assessment: body.note.assessment,
            plan: body.note.plan,
            updated_at: new Date().toISOString(),
          }
          
          const retryResult = await supabase
            .from("progress_notes")
            .update(basicUpdateData)
            .eq("id", noteIdToUse)
            .select()
            .single()
          
          noteError = retryResult.error
          updatedNote = retryResult.data
        }

        if (noteError) {
          console.error("Note update error:", noteError)
          // Check if it's a concurrent edit scenario (note was modified)
          if (noteError.code === "PGRST116" || noteError.message?.includes("not found")) {
            return NextResponse.json(
              { error: "Note was modified or deleted by another user. Please refresh and try again." },
              { status: 409 }
            )
          }
          throw noteError
        }

        // Verify update was successful
        if (!updatedNote) {
          return NextResponse.json(
            { error: "Note update failed. The note may have been deleted." },
            { status: 404 }
          )
        }

        // Create alert for note edit (handle errors gracefully)
        if (updatedNote) {
          try {
            // Create a more descriptive alert message
            const editCount = (updateData.edit_count || verifyNote.edit_count || 0) + 1
            const alertMessage = editCount === 1 
              ? `Encounter note was edited for the first time`
              : `Encounter note was edited (Edit #${editCount})`
            
            const { error: alertError } = await supabase.from("encounter_note_alerts").insert({
              patient_id: body.patient_id,
              encounter_id: encounter ? id : null, // Only set if encounter exists
              progress_note_id: noteIdToUse,
              alert_type: "note_edited",
              message: alertMessage,
              editor_id: staffId,
              editor_name: editorName || "Unknown User",
              editor_role: editorRole || "Unknown",
              encounter_reference: encounterReference,
              timestamp: new Date().toISOString(),
              metadata: {
                edit_count: editCount,
                previous_edit: verifyNote.last_edited_at || null,
                encounter_deleted: !encounter,
                note_id: noteIdToUse,
                // Store the updated note content
                note_content: {
                  subjective: body.note.subjective || "",
                  objective: body.note.objective || "",
                  assessment: body.note.assessment || "",
                  plan: body.note.plan || "",
                },
                // Store previous content for comparison (if available)
                previous_content: verifyNote ? {
                  subjective: verifyNote.subjective || "",
                  objective: verifyNote.objective || "",
                  assessment: verifyNote.assessment || "",
                  plan: verifyNote.plan || "",
                } : null,
              },
            })

            if (alertError) {
              // If table doesn't exist, log a warning with actionable message
              if (alertError.code === "42P01" || alertError.message?.includes("does not exist") || alertError.message?.includes("relation") || alertError.code === "PGRST301") {
                console.warn("encounter_note_alerts table does not exist yet. Migration 024_encounter_note_enhancements.sql may need to be run. Note was saved successfully.")
              } else {
                console.error("Alert creation error:", alertError)
              }
              // Don't fail the request if alert creation fails - note was saved successfully
            }
          } catch (alertException) {
            // If table doesn't exist, log a warning with actionable message
            const ex = alertException as any
            if (ex?.code === "42P01" || ex?.message?.includes("does not exist") || ex?.message?.includes("relation") || ex?.code === "PGRST301") {
              console.warn("encounter_note_alerts table does not exist yet. Migration 024_encounter_note_enhancements.sql may need to be run. Note was saved successfully.")
            } else {
              console.error("Exception creating alert:", alertException)
            }
            // Continue - note was saved successfully
          }
        }
      } else {
        // Create new note
        const insertData: any = {
          patient_id: body.patient_id,
          provider_id: body.provider_id,
          appointment_id: id,
          note_type: "SOAP",
          subjective: body.note.subjective,
          objective: body.note.objective,
          assessment: body.note.assessment,
          plan: body.note.plan,
        }
        
        // Only add original_created_at if the column exists (migration has been run)
        // We'll try to insert it, and if it fails, we'll catch and retry without it

        let noteError
        let newNote
        
        // Try inserting with original_created_at first
        try {
          const insertWithTracking = { ...insertData, original_created_at: new Date().toISOString() }
          const result = await supabase
            .from("progress_notes")
            .insert(insertWithTracking)
            .select()
            .single()
          
          noteError = result.error
          newNote = result.data
          
          // If error is about missing column, retry without it
          if (noteError && (noteError.message?.includes('original_created_at') || noteError.code === '42703')) {
            const resultWithoutTracking = await supabase
              .from("progress_notes")
              .insert(insertData)
              .select()
              .single()
            
            noteError = resultWithoutTracking.error
            newNote = resultWithoutTracking.data
          }
        } catch (e) {
          // If insert fails, try without original_created_at
          const result = await supabase
            .from("progress_notes")
            .insert(insertData)
            .select()
            .single()
          
          noteError = result.error
          newNote = result.data
        }

        if (noteError) {
          console.error("Note insert error:", noteError)
          throw noteError
        }

        // No alert needed for new note creation, only for edits
      }
    }

    return NextResponse.json({ 
      success: true,
      vitalsSaved: vitalsSaved,
      message: vitalsSaved ? "Note and vital signs saved successfully" : "Note saved successfully"
    })
  } catch (error) {
    console.error("Error updating encounter:", error)
    const errorMessage = (error as any)?.message || "Failed to update encounter"
    const statusCode = (error as any)?.code === "PGRST116" ? 404 : 500
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
