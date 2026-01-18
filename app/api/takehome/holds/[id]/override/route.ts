import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const holdId = Number.parseInt(id);
    const { override_reason, override_type, overridden_by } =
      await request.json();

    if (!Number.isFinite(holdId)) {
      return NextResponse.json(
        { error: "Invalid hold identifier" },
        { status: 400 }
      );
    }

    if (!override_reason || override_reason.trim().length < 20) {
      return NextResponse.json(
        { error: "Override reason must be at least 20 characters" },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    const { data: hold, error: holdError } = await supabase
      .from("compliance_holds")
      .select("id, patient_id, status")
      .eq("id", holdId)
      .single();

    if (holdError || !hold) {
      return NextResponse.json(
        { error: "Compliance hold not found" },
        { status: 404 }
      );
    }

    if (hold.status === "cleared") {
      return NextResponse.json(
        { error: "Hold already cleared" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("compliance_holds")
      .update({
        status: "cleared",
        cleared_by: overridden_by ?? null,
        cleared_time: now,
      })
      .eq("id", holdId);

    if (updateError) {
      console.error("[takehome] hold override update failed", updateError);
      return NextResponse.json(
        { error: "Failed to update compliance hold" },
        { status: 500 }
      );
    }

    await supabase.from("audit_trail").insert({
      user_id: overridden_by ?? null,
      patient_id: hold.patient_id,
      action: "charge_nurse_override",
      table_name: "compliance_holds",
      record_id: holdId,
      new_values: {
        override_reason,
        override_type,
        override_time: now,
        ip_address: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Override authorized. Medical Director has been notified.",
      override_id: `OVR-${holdId}-${Date.now()}`,
      review_required_by: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString(),
    });
  } catch (error) {
    console.error("Override processing failed:", error);
    return NextResponse.json(
      { error: "Failed to process override" },
      { status: 500 }
    );
  }
}
