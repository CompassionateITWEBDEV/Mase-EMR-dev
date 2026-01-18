"use server"

import { createServiceClient } from "@/lib/supabase/server"
import type { StaffRole } from "@/lib/auth/roles"

export interface StaffMember {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  role: StaffRole
  department: string | null
  is_active: boolean
  license_type: string | null
  license_number: string | null
  license_expiry: string | null
  hire_date: string | null
  employee_id: string | null
  permissions: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface CreateStaffInput {
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: StaffRole
  department?: string
  license_type?: string
  license_number?: string
  license_expiry?: string
  employee_id?: string
}

export async function getStaffMembers(): Promise<{ data: StaffMember[] | null; error: string | null }> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase.from("staff").select("*").order("last_name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching staff:", error)
      return { data: null, error: error.message }
    }

    return { data: data as StaffMember[], error: null }
  } catch (err) {
    console.error("[v0] Unexpected error fetching staff:", err)
    return { data: null, error: "Failed to fetch staff members" }
  }
}

export async function createStaffMember(
  input: CreateStaffInput,
): Promise<{ data: StaffMember | null; error: string | null }> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("staff")
      .insert({
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone || null,
        role: input.role,
        department: input.department || null,
        license_type: input.license_type || null,
        license_number: input.license_number || null,
        license_expiry: input.license_expiry || null,
        employee_id: input.employee_id || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating staff member:", error)
      return { data: null, error: error.message }
    }

    return { data: data as StaffMember, error: null }
  } catch (err) {
    console.error("[v0] Unexpected error creating staff:", err)
    return { data: null, error: "Failed to create staff member" }
  }
}

export async function updateStaffMember(
  id: string,
  updates: Partial<Omit<StaffMember, "id" | "created_at" | "updated_at">>,
): Promise<{ data: StaffMember | null; error: string | null }> {
  try {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("staff")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating staff member:", error)
      return { data: null, error: error.message }
    }

    return { data: data as StaffMember, error: null }
  } catch (err) {
    console.error("[v0] Unexpected error updating staff:", err)
    return { data: null, error: "Failed to update staff member" }
  }
}

export async function deleteStaffMember(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createServiceClient()

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("staff")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error deleting staff member:", error)
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error("[v0] Unexpected error deleting staff:", err)
    return { success: false, error: "Failed to delete staff member" }
  }
}
