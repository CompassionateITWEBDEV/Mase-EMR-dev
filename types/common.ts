/**
 * Common Type Definitions
 * Shared types used across multiple type definition files
 */

/**
 * Alert variant type for UI styling
 * Used for clinical alerts, AI risk alerts, and notification styling
 *
 * @example
 * - "destructive": Critical alerts requiring immediate attention (red styling)
 * - "warning": Important warnings that need review (yellow/orange styling)
 * - "info": Informational alerts for awareness (blue styling)
 * - "default": Standard notifications (neutral styling)
 */
export type AlertVariant = "destructive" | "warning" | "info" | "default";

/**
 * Priority level type for ordering/sorting
 * Used for clinical alerts, tasks, and queue management
 */
export type PriorityLevel = "high" | "medium" | "low";

/**
 * Common timestamp fields for database records
 */
export interface TimestampFields {
  /** Creation timestamp (ISO string) */
  created_at?: string;
  /** Last update timestamp (ISO string) */
  updated_at?: string | null;
}

/**
 * Common audit fields for records that track who made changes
 */
export interface AuditFields extends TimestampFields {
  /** User ID who created the record */
  created_by?: string | null;
  /** User ID who last modified the record */
  updated_by?: string | null;
}

