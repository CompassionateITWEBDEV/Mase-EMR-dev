/**
 * Patient Validation Utilities
 * Validation functions for patient data
 */

/**
 * Validate phone number format (US format)
 * @param phone - Phone number to validate
 * @returns True if valid, false otherwise
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");
  // US phone numbers should have 10 digits
  return digitsOnly.length === 10;
}

/**
 * Normalize phone number to digits only
 * @param phone - Phone number to normalize
 * @returns Normalized phone number (digits only)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate date string is a valid date
 * @param dateStr - Date string to validate
 * @returns True if valid, false otherwise
 */
export function validateDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate date of birth is in the past
 * @param dateOfBirth - Date of birth string
 * @returns True if valid (in the past), false otherwise
 */
export function validateDateOfBirth(dateOfBirth: string): boolean {
  if (!validateDate(dateOfBirth)) return false;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dob < today;
}

/**
 * Validate appointment date is not in the past (for new appointments)
 * @param appointmentDate - Appointment date string
 * @param allowPast - Whether to allow past dates (for historical data)
 * @returns True if valid, false otherwise
 */
export function validateAppointmentDate(
  appointmentDate: string,
  allowPast = false
): boolean {
  if (!validateDate(appointmentDate)) return false;
  if (allowPast) return true;
  const aptDate = new Date(appointmentDate);
  const now = new Date();
  return aptDate >= now;
}

