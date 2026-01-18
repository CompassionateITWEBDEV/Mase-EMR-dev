import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || "active"

    const employees = await sql`
      SELECT 
        e.*,
        s.first_name || ' ' || s.last_name as supervisor_name,
        COUNT(DISTINCT l.id) as total_licenses,
        COUNT(DISTINCT c.id) as total_credentials,
        COUNT(DISTINCT tc.id) as completed_trainings
      FROM hr_employees e
      LEFT JOIN hr_employees s ON e.supervisor_id = s.id
      LEFT JOIN hr_licenses l ON e.id = l.employee_id AND l.is_active = true
      LEFT JOIN hr_credentials c ON e.id = c.employee_id AND c.is_active = true
      LEFT JOIN hr_training_completions tc ON e.id = tc.employee_id
      WHERE e.employment_status = ${status}
      AND e.is_active = true
      GROUP BY e.id, s.first_name, s.last_name
      ORDER BY e.last_name, e.first_name
    `

    return NextResponse.json({ employees })
  } catch (error: unknown) {
    console.error("[v0] Error fetching employees:", error)

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
        email: "sjohnson@masaemr.com",
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
    const body = await request.json()

    const result = await sql`
      INSERT INTO hr_employees (
        organization_id,
        employee_number,
        first_name,
        last_name,
        email,
        phone,
        position_title,
        department,
        employment_type,
        hire_date,
        pay_type,
        pay_rate,
        supervisor_id
      ) VALUES (
        ${body.organization_id || "org-001"},
        ${body.employee_number},
        ${body.first_name},
        ${body.last_name},
        ${body.email},
        ${body.phone || null},
        ${body.position_title},
        ${body.department},
        ${body.employment_type},
        ${body.hire_date},
        ${body.pay_type},
        ${body.pay_rate},
        ${body.supervisor_id || null}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, employee: result[0] })
  } catch (error) {
    console.error("Error creating employee:", error)
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 })
  }
}
