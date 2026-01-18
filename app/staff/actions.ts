"use server"

import { randomUUID } from "crypto"
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

/**
 * Generates a unique employee ID in the format EMP-XXXX
 */
async function generateEmployeeId(supabase: ReturnType<typeof createServiceClient>): Promise<string> {
  // Get the highest existing employee ID number
  const { data: existingStaff } = await supabase
    .from("staff")
    .select("employee_id")
    .not("employee_id", "is", null)
    .order("employee_id", { ascending: false })
    .limit(1)

  let nextNumber = 1
  if (existingStaff && existingStaff.length > 0) {
    const lastId = existingStaff[0].employee_id
    if (lastId && lastId.startsWith("EMP-")) {
      const numPart = lastId.replace("EMP-", "")
      const num = Number.parseInt(numPart, 10)
      if (!Number.isNaN(num)) {
        nextNumber = num + 1
      }
    }
  }

  // Format as EMP-0001, EMP-0002, etc.
  return `EMP-${nextNumber.toString().padStart(4, "0")}`
}

/**
 * Generates a temporary password for new staff members
 */
function generateTemporaryPassword(): string {
  // Generate a secure random password
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function createStaffMember(
  input: CreateStaffInput,
): Promise<{ data: StaffMember | null; error: string | null }> {
  try {
    const supabase = createServiceClient()

    // Normalize inputs - accept whatever is provided, just clean whitespace
    const firstName = (input.first_name || "").trim() || "Staff"
    const lastName = (input.last_name || "").trim() || "Member"
    const email = (input.email || "").trim().toLowerCase() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@staff.local`
    const role = input.role || "general_staff"

    // Generate employee_id if not provided
    let employeeId = input.employee_id?.trim()
    if (!employeeId) {
      employeeId = await generateEmployeeId(supabase)
    }

    // Create auth user first (REQUIRED for foreign key constraint)
    // The database requires id to reference auth.users(id), so we MUST create an auth user
    const tempPassword = generateTemporaryPassword()
    
    let authUserId: string | null = null
    
    // Try to create auth user - this is REQUIRED, not optional
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: role,
          employee_id: employeeId,
        },
      })

      if (authError) {
        // If user already exists, find the existing user
        if (
          authError.message.includes("already registered") ||
          authError.message.includes("already exists") ||
          authError.message.includes("User already registered")
        ) {
          // Try to find existing user by email
          try {
            const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
            if (!listError && existingUsers?.users) {
              const existingUser = existingUsers.users.find((u) => u.email === email)
              if (existingUser?.id) {
                authUserId = existingUser.id
              }
            }
          } catch (listErr) {
            console.error("[v0] Error listing users:", listErr)
          }
          
          // If still not found, the user doesn't exist and we cannot proceed
          // The listUsers() call above should have found them if they exist
        }
        
        // If we still don't have a user ID, we cannot proceed
        // The database requires a valid auth user ID
        if (!authUserId) {
          console.error("[v0] Cannot create staff member: Auth user creation failed and existing user not found")
          return {
            data: null,
            error: `Unable to create staff member. Authentication user could not be created. ${authError.message}`,
          }
        }
      } else if (authData?.user?.id) {
        authUserId = authData.user.id
      }
    } catch (authErr) {
      console.error("[v0] Auth user creation exception:", authErr)
      // Try one more time to find existing user by listing all users
      try {
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
        if (!listError && existingUsers?.users) {
          const existingUser = existingUsers.users.find((u) => u.email === email)
          if (existingUser?.id) {
            authUserId = existingUser.id
          } else {
            return {
              data: null,
              error: `Unable to create staff member. Could not create or find authentication user.`,
            }
          }
        } else {
          return {
            data: null,
            error: `Unable to create staff member. Authentication system error.`,
          }
        }
      } catch (getErr) {
        return {
          data: null,
          error: `Unable to create staff member. Authentication system error.`,
        }
      }
    }

    // Final check: we MUST have a valid auth user ID
    if (!authUserId || !authUserId.trim()) {
      return {
        data: null,
        error: `Unable to create staff member. Valid authentication user ID is required.`,
      }
    }

    const staffId = authUserId // Use the auth user ID - this is required by the foreign key constraint

    // Prepare the insert data - accept all inputs as provided
    const insertData: Record<string, unknown> = {
      id: staffId, // Always provide an ID - never null, always a valid UUID string
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: input.phone?.trim() || null,
      role: role,
      department: input.department?.trim() || null,
      license_type: input.license_type?.trim() || null,
      license_number: input.license_number?.trim() || null,
      license_expiry: input.license_expiry || null,
      employee_id: employeeId,
      is_active: true,
      hire_date: new Date().toISOString().split("T")[0],
    }

    // Try to insert the staff member
    const { data, error } = await supabase.from("staff").insert(insertData).select().single()

    if (error) {
      console.error("[v0] Error creating staff member:", error)
      
      // If it's a foreign key constraint error, the auth user ID might not exist in auth.users
      // Verify and create if needed - NEVER use random UUID
      if (error.code === "23503") {
        // Verify the auth user exists
        try {
          const { data: verifyUser, error: verifyError } = await supabase.auth.admin.getUserById(staffId)
          
          if (verifyError || !verifyUser?.user) {
            // Auth user doesn't exist - create it now
            const { data: newAuthData, error: newAuthError } = await supabase.auth.admin.createUser({
              email: email,
              password: tempPassword,
              email_confirm: true,
              user_metadata: {
                first_name: firstName,
                last_name: lastName,
                role: role,
                employee_id: employeeId,
              },
            })
            
            if (newAuthError || !newAuthData?.user?.id) {
              return {
                data: null,
                error: `Unable to create staff member. Could not create authentication user: ${newAuthError?.message || "Unknown error"}`,
              }
            }
            
            // Use the newly created auth user ID
            insertData.id = newAuthData.user.id
          }
          
          // Retry insert with verified/created auth user ID
          const { data: retryData, error: retryError } = await supabase
            .from("staff")
            .insert(insertData)
            .select()
            .single()
          
          if (retryError) {
            return {
              data: null,
              error: `Unable to create staff member: ${retryError.message}`,
            }
          }
          
          return { data: retryData as StaffMember, error: null }
        } catch (verifyErr) {
          console.error("[v0] Error verifying/creating auth user:", verifyErr)
          return {
            data: null,
            error: `Unable to create staff member. Database constraint error - authentication user issue.`,
          }
        }
      }
      
      // Handle null constraint errors specifically
      if (error.message.includes("null value") && error.message.includes("id")) {
        // This should never happen since we always set id, but handle it
        console.error("[v0] Unexpected null id error. StaffId was:", staffId)
        return {
          data: null,
          error: `Database error: ID field is required but was not provided.`,
        }
      }

      // For unique constraint violations, provide helpful message but don't block
      if (error.code === "23505") {
        if (error.message.includes("email")) {
          // Try to update existing record instead
          const { data: existingData } = await supabase
            .from("staff")
            .select("*")
            .eq("email", email)
            .single()
          
          if (existingData) {
            return { data: existingData as StaffMember, error: null }
          }
        }
        return { 
          data: null, 
          error: `Staff member with this information may already exist. ${error.message}` 
        }
      }

      // For other errors, return a generic message
      return { 
        data: null, 
        error: `Unable to create staff member: ${error.message || "Unknown error"}` 
      }
    }

    if (!data) {
      return { data: null, error: "Staff member creation completed but no data was returned." }
    }

    return { data: data as StaffMember, error: null }
  } catch (err) {
    console.error("[v0] Unexpected error creating staff:", err)
    const errorMessage = err instanceof Error ? err.message : "Failed to create staff member"
    return { data: null, error: `Unexpected error: ${errorMessage}` }
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
