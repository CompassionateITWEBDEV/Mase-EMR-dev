/**
 * Patient sorting utilities
 * Functions for sorting patient lists
 */

import type { PatientWithRelations, PatientSortOptions } from "@/types/patient"

/**
 * Sort patients by field and direction
 */
export function sortPatients(
  patients: PatientWithRelations[],
  options: PatientSortOptions
): PatientWithRelations[] {
  const { field, direction } = options

  return [...patients].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (field) {
      case "last_name":
        aValue = a.last_name.toLowerCase()
        bValue = b.last_name.toLowerCase()
        break
      case "first_name":
        aValue = a.first_name.toLowerCase()
        bValue = b.first_name.toLowerCase()
        break
      case "created_at":
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
        break
      case "date_of_birth":
        aValue = new Date(a.date_of_birth).getTime()
        bValue = new Date(b.date_of_birth).getTime()
        break
      default:
        return 0
    }

    if (aValue < bValue) {
      return direction === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return direction === "asc" ? 1 : -1
    }
    return 0
  })
}

/**
 * Default sort: by last name ascending
 */
export function defaultSort(patients: PatientWithRelations[]): PatientWithRelations[] {
  return sortPatients(patients, { field: "last_name", direction: "asc" })
}

