import { createServiceClient } from "@/lib/supabase/service-role";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/middleware";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");
    const limit = parseInt(searchParams.get("limit") || "30");

    if (!patientId) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("vital_signs")
      .select("*")
      .eq("patient_id", patientId)
      .order("measurement_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[API] Error fetching vital signs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ vitalSigns: data || [] });
  } catch (error) {
    console.error("[API] Vital signs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vital signs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      // Allow in development mode
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      console.warn("[API] Development mode: Allowing request without authentication");
    }

    const supabase = createServiceClient();
    const body = await request.json();

    // Validate required fields
    if (!body.patient_id) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      );
    }

    // Build vital signs data object
    const vitalData: Record<string, unknown> = {
      patient_id: body.patient_id,
      measurement_date: body.measurement_date || new Date().toISOString(),
    };

    // Add optional fields if provided
    if (body.provider_id) vitalData.provider_id = body.provider_id;
    if (body.appointment_id) vitalData.appointment_id = body.appointment_id;
    
    // Blood pressure
    if (body.systolic_bp !== undefined && body.systolic_bp !== null && body.systolic_bp !== "") {
      vitalData.systolic_bp = parseInt(body.systolic_bp);
    }
    if (body.diastolic_bp !== undefined && body.diastolic_bp !== null && body.diastolic_bp !== "") {
      vitalData.diastolic_bp = parseInt(body.diastolic_bp);
    }
    
    // Heart rate
    if (body.heart_rate !== undefined && body.heart_rate !== null && body.heart_rate !== "") {
      vitalData.heart_rate = parseInt(body.heart_rate);
    }
    
    // Respiratory rate
    if (body.respiratory_rate !== undefined && body.respiratory_rate !== null && body.respiratory_rate !== "") {
      vitalData.respiratory_rate = parseInt(body.respiratory_rate);
    }
    
    // Temperature
    if (body.temperature !== undefined && body.temperature !== null && body.temperature !== "") {
      vitalData.temperature = parseFloat(body.temperature);
    }
    if (body.temperature_unit) vitalData.temperature_unit = body.temperature_unit;
    
    // Oxygen saturation
    if (body.oxygen_saturation !== undefined && body.oxygen_saturation !== null && body.oxygen_saturation !== "") {
      vitalData.oxygen_saturation = parseInt(body.oxygen_saturation);
    }
    
    // Weight
    if (body.weight !== undefined && body.weight !== null && body.weight !== "") {
      vitalData.weight = parseFloat(body.weight);
    }
    if (body.weight_unit) vitalData.weight_unit = body.weight_unit;
    
    // Height
    if (body.height_feet !== undefined && body.height_feet !== null && body.height_feet !== "") {
      vitalData.height_feet = parseInt(body.height_feet);
    }
    if (body.height_inches !== undefined && body.height_inches !== null && body.height_inches !== "") {
      vitalData.height_inches = parseInt(body.height_inches);
    }
    
    // BMI (auto-calculate if weight and height provided)
    if (body.bmi !== undefined && body.bmi !== null && body.bmi !== "") {
      vitalData.bmi = parseFloat(body.bmi);
    } else if (vitalData.weight && vitalData.height_feet) {
      // Calculate BMI: weight (lbs) / [height (in)]^2 x 703
      const heightInches = (vitalData.height_feet as number) * 12 + (vitalData.height_inches as number || 0);
      if (heightInches > 0) {
        const bmi = ((vitalData.weight as number) / (heightInches * heightInches)) * 703;
        vitalData.bmi = Math.round(bmi * 10) / 10; // Round to 1 decimal
      }
    }
    
    // Pain
    if (body.pain_scale !== undefined && body.pain_scale !== null && body.pain_scale !== "") {
      vitalData.pain_scale = parseInt(body.pain_scale);
    }
    if (body.pain_location) vitalData.pain_location = body.pain_location;
    
    // Notes
    if (body.notes) vitalData.notes = body.notes;

    console.log("[API] Creating vital signs:", vitalData);

    const { data, error } = await supabase
      .from("vital_signs")
      .insert(vitalData)
      .select()
      .single();

    if (error) {
      console.error("[API] Error creating vital signs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[API] Vital signs created successfully:", data.id);
    return NextResponse.json({ vitalSign: data, success: true });
  } catch (error) {
    console.error("[API] Vital signs POST error:", error);
    return NextResponse.json(
      { error: "Failed to create vital signs" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from("vital_signs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[API] Error deleting vital signs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Vital signs DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete vital signs" },
      { status: 500 }
    );
  }
}
