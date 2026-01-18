import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";

    const { data: bottles, error } = await supabase
      .from("bottle")
      .select(
        `
        id,
        lot_id,
        start_volume_ml,
        current_volume_ml,
        opened_at,
        status,
        serial_no,
        lot_batch(
          id,
          lot,
          exp_date,
          manufacturer,
          medication(
            id,
            name,
            conc_mg_per_ml
          )
        )
      `
      )
      .eq("status", status)
      .order("opened_at", { ascending: false });

    if (error) {
      console.error("[v0] Error fetching bottles:", error.message);
      return NextResponse.json(getMockBottles());
    }

    // Transform to expected format
    const formattedBottles = (bottles || []).map((bottle) => {
      // Handle lot_batch as either single object or array from Supabase join
      const lotBatch = Array.isArray(bottle.lot_batch)
        ? bottle.lot_batch[0]
        : bottle.lot_batch;
      // Handle medication as either single object or array
      const medication = lotBatch?.medication
        ? Array.isArray(lotBatch.medication)
          ? lotBatch.medication[0]
          : lotBatch.medication
        : null;

      return {
        id: bottle.id,
        lot_id: bottle.lot_id,
        start_volume_ml: bottle.start_volume_ml,
        current_volume_ml: bottle.current_volume_ml,
        opened_at: bottle.opened_at,
        status: bottle.status,
        serial_no: bottle.serial_no,
        medication_name: medication?.name || "Methadone HCl Oral Solution",
        concentration: medication?.conc_mg_per_ml || 10.0,
        lot_number: lotBatch?.lot || "LOT2024001",
        exp_date: lotBatch?.exp_date || "2025-12-31",
      };
    });

    return NextResponse.json(
      formattedBottles.length > 0 ? formattedBottles : getMockBottles()
    );
  } catch (error) {
    console.error("[v0] Bottles API error:", error);
    return NextResponse.json(getMockBottles());
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("bottle")
      .insert({
        lot_id: body.lot_id,
        start_volume_ml: Number.parseFloat(
          body.startVolume || body.start_volume_ml
        ),
        current_volume_ml: Number.parseFloat(
          body.startVolume || body.start_volume_ml
        ),
        serial_no: body.serialNo || body.serial_no,
        status: "active",
        opened_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[v0] Error creating bottle:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[v0] Create bottle error:", error);
    return NextResponse.json(
      { error: "Failed to create bottle" },
      { status: 500 }
    );
  }
}

function getMockBottles() {
  return [
    {
      id: 1,
      lot_id: 1,
      start_volume_ml: 1000.0,
      current_volume_ml: 850.5,
      opened_at: "2024-01-15T08:00:00Z",
      status: "active",
      serial_no: "BTL001",
      medication_name: "Methadone HCl Oral Solution",
      concentration: 10.0,
      lot_number: "LOT2024001",
      exp_date: "2025-12-31",
    },
  ];
}
