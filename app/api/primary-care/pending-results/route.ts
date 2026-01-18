/**
 * Primary Care Pending Results API Route
 * Returns pending lab and imaging results
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Query pending lab orders
    const { data: labOrders, error: labError } = await supabase
      .from("lab_orders")
      .select(
        `
        id,
        patient_id,
        order_date,
        status,
        test_name,
        patients (
          id,
          first_name,
          last_name
        )
      `
      )
      .in("status", ["pending", "in-progress", "collected"])
      .order("order_date", { ascending: false })
      .limit(limit);

    // Query pending imaging orders (if table exists)
    let imagingOrders: unknown[] = [];
    try {
      const { data: imaging } = await supabase
        .from("imaging_orders")
        .select(
          `
          id,
          patient_id,
          order_date,
          status,
          study_type,
          patients (
            id,
            first_name,
            last_name
          )
        `
        )
        .in("status", ["pending", "in-progress", "scheduled"])
        .order("order_date", { ascending: false })
        .limit(limit);

      imagingOrders = imaging || [];
    } catch (e) {
      // Imaging orders table may not exist, that's okay
      console.log("[API] Imaging orders table not found, skipping");
    }

    // Combine and format results
    const pendingResults = [
      ...(labOrders || []).map((order: unknown) => {
        const o = order as {
          id: string;
          patient_id: string;
          order_date: string;
          status: string;
          test_name?: string;
          patients?: { first_name: string; last_name: string } | null;
        };
        return {
          id: o.id,
          patientId: o.patient_id,
          patientName: o.patients
            ? `${o.patients.first_name} ${o.patients.last_name}`
            : "Unknown Patient",
          type: "lab",
          testName: o.test_name || "Lab Test",
          orderDate: o.order_date,
          status: o.status,
        };
      }),
      ...(imagingOrders || []).map((order: unknown) => {
        const o = order as {
          id: string;
          patient_id: string;
          order_date: string;
          status: string;
          study_type?: string;
          patients?: { first_name: string; last_name: string } | null;
        };
        return {
          id: o.id,
          patientId: o.patient_id,
          patientName: o.patients
            ? `${o.patients.first_name} ${o.patients.last_name}`
            : "Unknown Patient",
          type: "imaging",
          testName: o.study_type || "Imaging Study",
          orderDate: o.order_date,
          status: o.status,
        };
      }),
    ];

    const count = pendingResults.length;

    return NextResponse.json({
      pendingResults,
      count,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error("Unknown error");
    console.error("[API] Pending results API error:", err);
    return NextResponse.json(
      {
        pendingResults: [],
        count: 0,
        error: err.message || "Failed to fetch pending results",
      },
      { status: 500 }
    );
  }
}

