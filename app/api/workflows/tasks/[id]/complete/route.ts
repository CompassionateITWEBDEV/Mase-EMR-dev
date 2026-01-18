import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const body = await request.json();
  const { completed_by, notes, form_data } = body;

  const { data, error } = await supabase
    .from("workflow_tasks")
    .update({
      status: "completed",
      completed_by,
      completed_at: new Date().toISOString(),
      notes,
      form_data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[v0] Error completing workflow task:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}
