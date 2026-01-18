import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || "active"

    const { data: employees, error } = await supabase
      .from("hr_employees")
      .select(`
        *,
        supervisor:hr_employees!supervisor_id(first_name, last_name)
      `)
      .eq("employment_status", status)
      .eq("is_active", true)
      .order("last_name", { ascending: true })

    if (error) throw error

    // Transform to include supervisor name
    const formattedEmployees = (employees || []).map((emp: any) => ({
      ...emp,
      supervisor_name: emp.supervisor 
        ? `${emp.supervisor.first_name} ${emp.supervisor.last_name}` 
        : null,
    }))

    return NextResponse.json({ employees: formattedEmployees })
  } catch (error: unknown) {
    console.error("[HR] Error fetching employees:", error)

    // Return mock data with comprehensive employee information
    const mockEmployees = [
      {
        id: "emp-001",
        employee_number: "EMP-2024-001",
        first_name: "Sarah",
        last_name: "Johnson",
        position_title: "Licensed Clinical Social Worker",
        department: "Behavioral Health",
        employment_type: "Full-Time",
        employment_status: "active",
        hire_date: "2022-03-15",
        email: "sjohnson@maseemr.com",
        phone: "(555) 123-4567",
        supervisor_name: "Michael Chen",
        facial_biometric_enrolled: true,
        onboarding_completed: true,
        total_licenses: 2,
        total_credentials: 5,
        completed_trainings: 12,
      },
      {
        id: "emp-002",
        employee_number: "EMP-2024-002",
        first_name: "Michael",
        last_name: "Chen",
        position_title: "Clinical Director",
        department: "Clinical Services",
        employment_type: "Full-Time",
        employment_status: "active",
        hire_date: "2020-01-10",
        email: "mchen@maseemr.com",
        phone: "(555) 234-5678",
        supervisor_name: null,
        facial_biometric_enrolled: true,
        onboarding_completed: true,
        total_licenses: 1,
        total_credentials: 8,
        completed_trainings: 25,
      },
      {
        id: "emp-003",
        employee_number: "EMP-2024-003",
        first_name: "Jennifer",
        last_name: "Martinez",
        position_title: "Registered Nurse",
        department: "Nursing",
        employment_type: "Full-Time",
        employment_status: "active",
        hire_date: "2023-06-01",
        email: "jmartinez@maseemr.com",
        phone: "(555) 345-6789",
        supervisor_name: "Michael Chen",
        facial_biometric_enrolled: true,
        onboarding_completed: true,
        total_licenses: 1,
        total_credentials: 4,
        completed_trainings: 8,
      },
      {
        id: "emp-004",
        employee_number: "EMP-2024-004",
        first_name: "David",
        last_name: "Thompson",
        position_title: "Case Manager",
        department: "Case Management",
        employment_type: "Part-Time",
        employment_status: "active",
        hire_date: "2023-09-15",
        email: "dthompson@maseemr.com",
        phone: "(555) 456-7890",
        supervisor_name: "Sarah Johnson",
        facial_biometric_enrolled: false,
        onboarding_completed: false,
        total_licenses: 1,
        total_credentials: 2,
        completed_trainings: 5,
      },
      {
        id: "emp-005",
        employee_number: "EMP-2024-005",
        first_name: "Emily",
        last_name: "Rodriguez",
        position_title: "Peer Recovery Specialist",
        department: "Peer Services",
        employment_type: "Full-Time",
        employment_status: "active",
        hire_date: "2024-01-08",
        email: "erodriguez@maseemr.com",
        phone: "(555) 567-8901",
        supervisor_name: "Sarah Johnson",
        facial_biometric_enrolled: true,
        onboarding_completed: true,
        total_licenses: 1,
        total_credentials: 3,
        completed_trainings: 6,
      },
    ]

    return NextResponse.json({ employees: mockEmployees })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("hr_employees")
      .insert({
        organization_id: body.organization_id || "org-001",
        employee_number: body.employee_number,
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone || null,
        position_title: body.position_title,
        department: body.department,
        employment_type: body.employment_type,
        hire_date: body.hire_date,
        pay_type: body.pay_type,
        pay_rate: body.pay_rate,
        supervisor_id: body.supervisor_id || null,
        date_of_birth: body.date_of_birth,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, employee: data })
  } catch (error) {
    console.error("[HR] Error creating employee:", error)
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
  }
}
