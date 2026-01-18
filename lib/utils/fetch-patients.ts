/**
 * Utility function to fetch all patients from the database
 * Used primarily for dropdown/select components
 */

import type { Patient } from "@/types/patient";

/**
 * Extended Patient type that includes is_active field from API response
 */
interface PatientWithActive extends Patient {
  is_active?: boolean | null;
}

export interface FetchAllPatientsOptions {
  includeInactive?: boolean;
  search?: string;
}

/**
 * Fetches all patients from the database via the API endpoint
 * @param options - Optional configuration for fetching patients
 * @returns Promise<Patient[]> - Array of patient objects
 */
export async function fetchAllPatients(
  options: FetchAllPatientsOptions = {}
): Promise<Patient[]> {
  const { includeInactive = false, search } = options;

  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Set status filter - 'all' includes inactive, otherwise defaults to active
    params.append("status", includeInactive ? "all" : "active");
    
    // Set a high limit to fetch all patients (up to 10,000)
    params.append("limit", "10000");
    
    // Add search parameter if provided
    if (search) {
      params.append("search", search);
    }

    // Fetch from the API endpoint
    const response = await fetch(`/api/patients?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[fetchAllPatients] API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || "Unknown error",
      });
      
      // Return empty array on error to prevent UI crashes
      return [];
    }

    const data = await response.json();
    const patients: PatientWithActive[] = data.patients || [];

    // Filter out inactive patients if not including them
    // (API might return some inactive patients even with status=active)
    const filteredPatients = includeInactive
      ? patients
      : patients.filter((p) => p.is_active !== false);

    // Sort by last name, then first name for better UX in dropdowns
    const sortedPatients = filteredPatients.sort((a, b) => {
      const lastNameCompare = (a.last_name || "").localeCompare(
        b.last_name || ""
      );
      if (lastNameCompare !== 0) return lastNameCompare;
      return (a.first_name || "").localeCompare(b.first_name || "");
    });

    console.log(
      `[fetchAllPatients] Fetched ${sortedPatients.length} patients`,
      {
        includeInactive,
        search,
        totalFromAPI: patients.length,
      }
    );

    // Cast back to Patient[] for return type (is_active is not in base Patient interface)
    return sortedPatients as Patient[];
  } catch (error) {
    console.error("[fetchAllPatients] Network or parsing error:", error);
    
    // Return empty array on error to prevent UI crashes
    return [];
  }
}
