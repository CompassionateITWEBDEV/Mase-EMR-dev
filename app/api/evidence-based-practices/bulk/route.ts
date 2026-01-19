import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import { recalculateEbpMetrics } from "../../evidence-based-practices/utils/calculate-metrics"

// POST - Bulk operations for EBPs
export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const { operation, ebp_id, items } = body

    if (!operation || !ebp_id) {
      return NextResponse.json({ error: "Operation and EBP ID are required" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required and must not be empty" }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let results: any[] = []
    let errors: any[] = []

    switch (operation) {
      case "assign_staff": {
        // Bulk assign/train staff
        for (const item of items) {
          try {
            if (!item.staff_id) {
              errors.push({ item, error: "Staff ID is required" })
              continue
            }

            // Date validation
            if (item.training_date) {
              const trainingDate = new Date(item.training_date)
              trainingDate.setHours(0, 0, 0, 0)
              if (trainingDate > today) {
                errors.push({ item, error: "Training date cannot be in the future" })
                continue
              }
            }

            if (item.certification_date) {
              const certDate = new Date(item.certification_date)
              certDate.setHours(0, 0, 0, 0)
              if (certDate > today) {
                errors.push({ item, error: "Certification date cannot be in the future" })
                continue
              }
              if (item.training_date && certDate < new Date(item.training_date)) {
                errors.push({ item, error: "Certification date cannot be before training date" })
                continue
              }
            }

            if (item.certification_expires_date && item.certification_date) {
              const expiresDate = new Date(item.certification_expires_date)
              expiresDate.setHours(0, 0, 0, 0)
              const certDate = new Date(item.certification_date)
              certDate.setHours(0, 0, 0, 0)
              if (expiresDate <= certDate) {
                errors.push({ item, error: "Certification expiration date must be after certification date" })
                continue
              }
            }

            const assignmentData = {
              ebp_id: ebp_id,
              staff_id: item.staff_id,
              organization_id: item.organization_id || null,
              status: item.status || 'pending',
              training_date: item.training_date || null,
              certification_date: item.certification_date || null,
              certification_expires_date: item.certification_expires_date || null,
              certificate_url: item.certificate_url || null,
              training_module_id: item.training_module_id || null,
              assigned_by: item.assigned_by || null,
            }

            const { data, error } = await supabase
              .from("ebp_staff_assignments")
              .upsert(assignmentData, { onConflict: 'ebp_id,staff_id' })
              .select()
              .single()

            if (error) {
              errors.push({ item, error: error.message })
            } else {
              results.push(data)
            }
          } catch (err) {
            errors.push({ item, error: err instanceof Error ? err.message : "Unknown error" })
          }
        }
        break
      }

      case "record_deliveries": {
        // Bulk record patient deliveries
        for (const item of items) {
          try {
            if (!item.patient_id) {
              errors.push({ item, error: "Patient ID is required" })
              continue
            }

            const deliveryDate = item.delivery_date || new Date().toISOString().split('T')[0]
            const deliveryDateObj = new Date(deliveryDate)
            deliveryDateObj.setHours(0, 0, 0, 0)

            if (deliveryDateObj > today) {
              errors.push({ item, error: "Delivery date cannot be in the future" })
              continue
            }

            // Check for duplicates
            const { data: existing } = await supabase
              .from("ebp_patient_delivery")
              .select("id")
              .eq("ebp_id", ebp_id)
              .eq("patient_id", item.patient_id)
              .eq("delivery_date", deliveryDate)
              .maybeSingle()

            if (existing) {
              errors.push({ item, error: "Duplicate delivery already exists for this patient and date" })
              continue
            }

            const deliveryData = {
              ebp_id: ebp_id,
              patient_id: item.patient_id,
              organization_id: item.organization_id || null,
              delivery_date: deliveryDate,
              delivery_type: item.delivery_type || 'session',
              encounter_id: item.encounter_id || null,
              delivered_by: item.delivered_by || null,
              notes: item.notes || null,
            }

            const { data, error } = await supabase
              .from("ebp_patient_delivery")
              .insert(deliveryData)
              .select()
              .single()

            if (error) {
              errors.push({ item, error: error.message })
            } else {
              results.push(data)
            }
          } catch (err) {
            errors.push({ item, error: err instanceof Error ? err.message : "Unknown error" })
          }
        }
        break
      }

      case "record_outcomes": {
        // Bulk record outcomes
        for (const item of items) {
          try {
            if (!item.patient_id) {
              errors.push({ item, error: "Patient ID is required" })
              continue
            }

            if (!item.outcome_type || !item.outcome_type.trim()) {
              errors.push({ item, error: "Outcome type is required" })
              continue
            }

            const measurementDate = item.measurement_date || new Date().toISOString().split('T')[0]
            const measurementDateObj = new Date(measurementDate)
            measurementDateObj.setHours(0, 0, 0, 0)

            if (measurementDateObj > today) {
              errors.push({ item, error: "Measurement date cannot be in the future" })
              continue
            }

            // Outcome value validation
            if (item.outcome_value !== undefined && item.outcome_value !== null && item.outcome_value !== '') {
              const outcomeValue = parseFloat(item.outcome_value)
              if (isNaN(outcomeValue)) {
                errors.push({ item, error: "Outcome value must be a valid number" })
                continue
              }

              const outcomeType = item.outcome_type.trim().toLowerCase()
              if (outcomeType.includes('percentage') || outcomeType.includes('rate') || outcomeType.includes('%')) {
                if (outcomeValue < 0 || outcomeValue > 100) {
                  errors.push({ item, error: "Percentage/rate outcomes must be between 0 and 100" })
                  continue
                }
              } else if (outcomeType.includes('score') || outcomeType.includes('scale')) {
                if (outcomeValue < 0) {
                  errors.push({ item, error: "Score outcomes cannot be negative" })
                  continue
                }
                if (outcomeValue > 100) {
                  errors.push({ item, error: "Score outcomes should typically be between 0 and 100" })
                  continue
                }
              } else if (outcomeType.includes('count') || outcomeType.includes('number')) {
                if (outcomeValue < 0) {
                  errors.push({ item, error: "Count outcomes cannot be negative" })
                  continue
                }
              }
            }

            // Check for duplicates
            const { data: existing } = await supabase
              .from("ebp_outcomes")
              .select("id")
              .eq("ebp_id", ebp_id)
              .eq("patient_id", item.patient_id)
              .eq("outcome_type", item.outcome_type.trim())
              .eq("measurement_date", measurementDate)
              .maybeSingle()

            if (existing) {
              errors.push({ item, error: "Duplicate outcome already exists for this patient, type, and date" })
              continue
            }

            const outcomeData = {
              ebp_id: ebp_id,
              patient_id: item.patient_id,
              organization_id: item.organization_id || null,
              outcome_type: item.outcome_type.trim(),
              outcome_value: item.outcome_value !== undefined && item.outcome_value !== null && item.outcome_value !== '' ? parseFloat(item.outcome_value) : null,
              outcome_unit: item.outcome_unit || null,
              measurement_date: measurementDate,
              encounter_id: item.encounter_id || null,
              assessment_id: item.assessment_id || null,
              notes: item.notes || null,
              recorded_by: item.recorded_by || null,
            }

            const { data, error } = await supabase
              .from("ebp_outcomes")
              .insert(outcomeData)
              .select()
              .single()

            if (error) {
              errors.push({ item, error: error.message })
            } else {
              results.push(data)
            }
          } catch (err) {
            errors.push({ item, error: err instanceof Error ? err.message : "Unknown error" })
          }
        }
        break
      }

      default:
        return NextResponse.json({ error: "Invalid operation. Supported: assign_staff, record_deliveries, record_outcomes" }, { status: 400 })
    }

    // Recalculate metrics if any items were successfully processed
    if (results.length > 0) {
      try {
        await recalculateEbpMetrics(ebp_id)
      } catch (metricError) {
        console.warn("Error recalculating metrics after bulk operation:", metricError)
      }
    }

    return NextResponse.json({
      success: true,
      operation,
      processed: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Unexpected error in POST /api/evidence-based-practices/bulk:", error)
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

