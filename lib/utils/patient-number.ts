/**
 * Patient Number Generation Utility
 * 
 * Generates sequential patient numbers (client_number) based on program type.
 * Format: PREFIX-0000
 * - PREFIX: OTP, MAT, or PC (based on program_type)
 * - 0000: Sequential number starting from 0001 for each program type independently
 * 
 * Examples:
 * - OTP-0001, OTP-0002, OTP-0003, ..., OTP-9999
 * - MAT-0001, MAT-0002, MAT-0003, ..., MAT-9999
 * - PC-0001, PC-0002, PC-0003, ..., PC-9999
 */

import type { SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";

// Use a more flexible type that accepts any Supabase client
type SupabaseClient = SupabaseClientType<any, "public", any>;

/**
 * Maps program type to patient number prefix
 */
function getProgramPrefix(programType: string | null | undefined): string {
  if (!programType) {
    return "OTP"; // Default to OTP
  }

  const normalized = programType.toLowerCase().trim();
  
  if (normalized === "otp" || normalized.includes("opioid treatment")) {
    return "OTP";
  } else if (normalized === "mat" || normalized.includes("medication-assisted")) {
    return "MAT";
  } else if (normalized === "primary_care" || normalized === "primary care" || normalized.includes("primary")) {
    return "PC";
  } else if (normalized === "sub" || normalized.includes("substance use")) {
    return "SUB";
  } else if (normalized === "beh" || normalized.includes("behavioral health")) {
    return "BEH";
  }
  
  // For custom program types, use first 3 uppercase letters
  // Remove any non-alphanumeric characters and take first 3 letters
  const cleaned = programType.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleaned.length >= 3) {
    return cleaned.substring(0, 3);
  } else if (cleaned.length > 0) {
    // Pad with X if less than 3 characters
    return cleaned.padEnd(3, "X");
  }
  
  // Default to OTP for unknown program types
  return "OTP";
}

/**
 * Parses a patient number string to extract the sequential number
 * Supports both new format (PREFIX-0000) and old format (PREFIX-XXX-YYYY) for migration
 * Returns the sequential number, or null if format is invalid
 */
function parsePatientNumber(clientNumber: string, prefix: string): number | null {
  // Try new format first: PREFIX-0000
  const newFormatPattern = new RegExp(`^${prefix}-(\\d{4})$`);
  const newMatch = clientNumber.match(newFormatPattern);
  
  if (newMatch) {
    return parseInt(newMatch[1], 10);
  }
  
  // Try old format for migration: PREFIX-XXX-YYYY
  const oldFormatPattern = new RegExp(`^${prefix}-(\\d{3})-(\\d{4})$`);
  const oldMatch = clientNumber.match(oldFormatPattern);
  
  if (oldMatch) {
    // Convert old format to sequential number
    const group = parseInt(oldMatch[1], 10);
    const sequence = parseInt(oldMatch[2], 10);
    // Old format: group 1 = 1-1000, group 2 = 1001-2000, etc.
    return (group - 1) * 1000 + sequence;
  }
  
  return null;
}

/**
 * Generates the next patient number for a given program type
 * 
 * @param programType - The program type (otp, mat, primary_care)
 * @param supabase - Supabase client instance
 * @returns The next patient number in format PREFIX-0000
 */
export async function generatePatientNumber(
  programType: string | null | undefined,
  supabase: SupabaseClient
): Promise<string> {
  const prefix = getProgramPrefix(programType);
  
  try {
    // Query all existing client_numbers for this program type
    // We need to get all of them to find the highest number
    const { data: patients, error } = await supabase
      .from("patients")
      .select("client_number, program_type")
      .not("client_number", "is", null)
      .ilike("client_number", `${prefix}-%`);
    
    if (error) {
      console.warn("[Patient Number] Error querying existing numbers:", error);
      // If query fails, start fresh
      return `${prefix}-0001`;
    }
    
    // Filter to only patients with matching program type (if provided)
    type PatientWithNumber = { client_number: string | null; program_type?: string | null };
    let relevantPatients: PatientWithNumber[] = (patients || []) as PatientWithNumber[];
    if (programType) {
      const normalizedProgramType = programType.toLowerCase().trim();
      relevantPatients = relevantPatients.filter((p) => {
        if (!p.program_type) return false;
        const pt = p.program_type.toLowerCase().trim();
        return pt === normalizedProgramType;
      });
    }
    
    // If no existing patients, start at 0001
    if (relevantPatients.length === 0) {
      return `${prefix}-0001`;
    }
    
    // Parse all patient numbers and find the highest sequential number
    let maxNumber = 0;
    let foundValidNumber = false;
    
    for (const patient of relevantPatients) {
      if (!patient.client_number) continue;
      const parsed = parsePatientNumber(patient.client_number, prefix);
      if (parsed !== null) {
        foundValidNumber = true;
        if (parsed > maxNumber) {
          maxNumber = parsed;
        }
      }
    }
    
    // If no valid numbers found, start at 0001
    if (!foundValidNumber) {
      return `${prefix}-0001`;
    }
    
    // Generate next number (increment by 1)
    const nextNumber = maxNumber + 1;
    
    // Ensure number doesn't exceed 9999 (4 digits)
    if (nextNumber > 9999) {
      console.error(`[Patient Number] Maximum patient number reached for ${prefix}. Cannot generate more numbers.`);
      throw new Error(`Maximum patient number reached for ${prefix} program type`);
    }
    
    // Format with leading zeros (4 digits)
    const numberStr = nextNumber.toString().padStart(4, "0");
    
    return `${prefix}-${numberStr}`;
    
  } catch (error) {
    console.error("[Patient Number] Error generating patient number:", error);
    // On error, return a default starting number
    return `${prefix}-0001`;
  }
}

