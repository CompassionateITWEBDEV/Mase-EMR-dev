import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get("patientId")

  if (!patientId) {
    return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
  }

  // Mock data for demonstration - replace with real database query
  const mockPrograms = [
    {
      id: "prog-1",
      program_name: "Lower Back Strengthening Program",
      therapist_name: "Dr. Sarah Williams, PT",
      frequency: "3x per week",
      status: "active",
      start_date: "2025-01-01",
      end_date: "2025-03-01",
      compliance_rate: 85,
      days_completed: 18,
      streak: 3,
      program_goals: "Reduce lower back pain, improve core strength, and increase flexibility for daily activities",
      special_instructions:
        "Stop immediately if you feel sharp pain. Warm up with 5 minutes of walking before starting.",
      exercises: [
        {
          id: "ex-1",
          exercise_name: "Cat-Cow Stretch",
          description: "Gentle spinal flexibility exercise",
          sets: 2,
          reps: 10,
          hold_duration_seconds: 3,
          video_url: "https://example.com/cat-cow",
          completed_today: false,
        },
        {
          id: "ex-2",
          exercise_name: "Bird Dog",
          description: "Core stability exercise",
          sets: 3,
          reps: 10,
          hold_duration_seconds: 5,
          video_url: "https://example.com/bird-dog",
          completed_today: false,
        },
        {
          id: "ex-3",
          exercise_name: "Glute Bridge",
          description: "Strengthen glutes and lower back",
          sets: 3,
          reps: 12,
          hold_duration_seconds: null,
          video_url: "https://example.com/glute-bridge",
          completed_today: true,
        },
      ],
      weekly_progress: [
        { day: "Mon", completed: true },
        { day: "Tue", completed: false },
        { day: "Wed", completed: true },
        { day: "Thu", completed: true },
        { day: "Fri", completed: false },
        { day: "Sat", completed: false },
        { day: "Sun", completed: false },
      ],
    },
  ]

  return NextResponse.json(mockPrograms)
}
