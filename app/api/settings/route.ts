import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { profile } = body

    console.log("[v0] Saving settings:", profile)

    // TODO: Save to database
    // const { data, error } = await supabase
    //   .from('user_profiles')
    //   .update(profile)
    //   .eq('id', userId)

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    })
  } catch (error) {
    console.error("[v0] Settings save error:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
