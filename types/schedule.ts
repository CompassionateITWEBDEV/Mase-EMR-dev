/**
 * Schedule and Appointment Type Definitions
 * Types for appointments, scheduling, and calendar display
 */

/**
 * Appointment status values
 * Note: Both "no_show" (underscore) and "no-show" (hyphen) are supported
 * for compatibility with different database schemas
 */
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "no-show"
  | "rescheduled";

/**
 * Appointment type values
 */
export type AppointmentType =
  | "new_patient"
  | "follow_up"
  | "annual_wellness"
  | "sick_visit"
  | "procedure"
  | "telehealth"
  | "group_therapy"
  | "individual_therapy"
  | "medication_management"
  | "assessment"
  | "other";

/**
 * Full appointment record interface for advanced scheduling features.
 *
 * @description
 * This interface extends beyond the base `Appointment` interface in `types/patient.ts`
 * to include additional fields for advanced scheduling functionality.
 *
 * **Relationship to Appointment (types/patient.ts):**
 * - Base fields shared: id, patient_id, provider_id, appointment_date, duration_minutes,
 *   appointment_type, status, notes, created_at, updated_at, patients, providers
 * - AppointmentRecord is the more complete type for scheduling-focused operations
 * - Use `Appointment` from patient.ts for basic patient-centric views
 * - Use `AppointmentRecord` for scheduling, check-in/check-out, and calendar operations
 *
 * **Extended fields beyond base Appointment:**
 * - `room`: Physical location/room assignment
 * - `check_in_time`: When patient checked in (for tracking)
 * - `check_out_time`: When patient checked out (for metrics)
 * - `is_recurring`: Flag for recurring appointment patterns
 * - `recurrence_id`: Links to recurrence pattern definition
 * - `reason_for_visit`: Detailed visit reason (beyond appointment_type)
 *
 * @see Appointment in types/patient.ts for the base interface
 */
export interface AppointmentRecord {
  /** UUID primary key */
  id: string;
  /** Patient UUID */
  patient_id: string;
  /** Provider UUID */
  provider_id: string;
  /** Appointment date and time (ISO string) */
  appointment_date: string;
  /** Duration in minutes */
  duration_minutes: number;
  /** Type of appointment */
  appointment_type: AppointmentType | string;
  /** Current status */
  status: AppointmentStatus;
  /** Appointment notes */
  notes?: string | null;

  // ─── Extended fields for advanced scheduling ───────────────────────────────

  /** Room or location assignment for the appointment */
  room?: string | null;
  /** Check-in timestamp - when patient arrived and checked in */
  check_in_time?: string | null;
  /** Check-out timestamp - when patient completed visit and left */
  check_out_time?: string | null;
  /** Flag indicating if this is part of a recurring series */
  is_recurring?: boolean;
  /** UUID linking to the recurrence pattern definition (if is_recurring) */
  recurrence_id?: string | null;
  /** Detailed reason for visit (more specific than appointment_type) */
  reason_for_visit?: string | null;

  // ─── Standard audit fields ─────────────────────────────────────────────────

  /** Creation timestamp */
  created_at?: string;
  /** Last update timestamp */
  updated_at?: string | null;

  // ─── Related entity data (populated via joins) ─────────────────────────────

  /** Related patient data (from joins) */
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth?: string;
    phone?: string | null;
  };
  /** Related provider data (from joins) */
  providers?: {
    id: string;
    first_name: string;
    last_name: string;
    specialization?: string | null;
  };
}

/**
 * Schedule item for daily schedule display (simplified appointment view)
 */
export interface ScheduleItem {
  /** Display time (e.g., '9:00 AM') */
  time: string;
  /** Patient name */
  patient: string;
  /** Patient ID for linking */
  patientId?: string;
  /** Appointment ID for operations */
  appointmentId?: string;
  /** Appointment type label */
  type: string;
  /** Current status */
  status: AppointmentStatus | string;
  /** Duration as formatted string (e.g., '45 min', '1 hour') */
  duration?: string;
  /** Provider name */
  provider?: string;
  /** Room/location */
  room?: string;
}

/**
 * Schedule filters for querying appointments
 */
export interface ScheduleFilters {
  /** Filter by date */
  date?: string;
  /** Filter by date range start */
  startDate?: string;
  /** Filter by date range end */
  endDate?: string;
  /** Filter by provider ID */
  providerId?: string;
  /** Filter by status */
  status?: AppointmentStatus | AppointmentStatus[];
  /** Filter by appointment type */
  appointmentType?: AppointmentType | AppointmentType[];
  /** Filter by patient ID */
  patientId?: string;
}

/**
 * Schedule summary statistics
 */
export interface ScheduleSummary {
  /** Total appointments */
  total: number;
  /** Completed appointments */
  completed: number;
  /** Scheduled (pending) appointments */
  scheduled: number;
  /** Cancelled appointments */
  cancelled: number;
  /** No-show count */
  noShows: number;
  /** In-progress appointments */
  inProgress: number;
}

/**
 * Available time slot for scheduling
 */
export interface TimeSlot {
  /** Start time (ISO string) */
  startTime: string;
  /** End time (ISO string) */
  endTime: string;
  /** Provider ID */
  providerId: string;
  /** Provider name */
  providerName: string;
  /** Whether slot is available */
  isAvailable: boolean;
}

/**
 * Appointments API response
 */
export interface AppointmentsResponse {
  appointments: AppointmentRecord[];
  summary?: ScheduleSummary;
  error?: string;
}
