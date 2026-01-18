// Role definitions and permissions for staff management system
export const STAFF_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  DOCTOR: "doctor",
  RN: "rn",
  LPN: "lpn",
  DISPENSING_NURSE: "dispensing_nurse",
  PHARMACIST: "pharmacist",
  COUNSELOR: "counselor",
  CASE_MANAGER: "case_manager",
  PEER_RECOVERY: "peer_recovery",
  MEDICAL_ASSISTANT: "medical_assistant",
  INTAKE: "intake",
  FRONT_DESK: "front_desk",
  BILLING: "billing",
  SUPERVISOR: "supervisor",
  GENERAL_STAFF: "general_staff",
} as const

export const REGULATORY_ROLES = {
  DEA_INSPECTOR: "dea_inspector",
  JOINT_COMMISSION_SURVEYOR: "joint_commission_surveyor",
  STATE_INSPECTOR: "state_inspector",
  COMPLIANCE_OFFICER: "compliance_officer",
  READ_ONLY_AUDITOR: "read_only_auditor",
} as const

export type StaffRole = (typeof STAFF_ROLES)[keyof typeof STAFF_ROLES]
export type RegulatoryRole = (typeof REGULATORY_ROLES)[keyof typeof REGULATORY_ROLES]
export type UserRole = StaffRole | RegulatoryRole

// Comprehensive license types
export const LICENSE_TYPES = {
  MD: "MD",
  DO: "DO",
  NP: "NP",
  PA: "PA",
  RN: "RN",
  LPN: "LPN",
  LCSW: "LCSW",
  LMSW: "LMSW",
  LPC: "LPC",
  LPCC: "LPCC",
  LCDC: "LCDC",
  CADC: "CADC",
  CPS: "CPS",
  CPRS: "CPRS",
  CMA: "CMA",
  PHARM_D: "PharmD",
  RPH: "RPh",
  NONE: "None",
} as const

export type LicenseType = (typeof LICENSE_TYPES)[keyof typeof LICENSE_TYPES]

// Permission definitions
export const PERMISSIONS = {
  // Patient management
  PATIENTS_READ: "patients:read",
  PATIENTS_WRITE: "patients:write",
  PATIENTS_DELETE: "patients:delete",

  // Medication management
  MEDICATIONS_READ: "medications:read",
  MEDICATIONS_WRITE: "medications:write",
  MEDICATIONS_PRESCRIBE: "medications:prescribe",
  MEDICATIONS_DISPENSE: "medications:dispense",

  // Assessment and treatment
  ASSESSMENTS_READ: "assessments:read",
  ASSESSMENTS_WRITE: "assessments:write",
  TREATMENT_PLANS_READ: "treatment_plans:read",
  TREATMENT_PLANS_WRITE: "treatment_plans:write",

  // Progress notes
  PROGRESS_NOTES_READ: "progress_notes:read",
  PROGRESS_NOTES_WRITE: "progress_notes:write",

  // Appointments
  APPOINTMENTS_READ: "appointments:read",
  APPOINTMENTS_WRITE: "appointments:write",
  APPOINTMENTS_SCHEDULE: "appointments:schedule",

  // Staff management
  STAFF_READ: "staff:read",
  STAFF_WRITE: "staff:write",
  STAFF_ADMIN: "staff:admin",

  // Regulatory and compliance
  COMPLIANCE_READ: "compliance:read",
  COMPLIANCE_WRITE: "compliance:write",
  REGULATORY_ACCESS: "regulatory:access",

  // System administration
  SYSTEM_ADMIN: "system:admin",
  SUPER_ADMIN: "super:admin",

  // Billing
  BILLING_READ: "billing:read",
  BILLING_WRITE: "billing:write",

  // Inventory
  INVENTORY_READ: "inventory:read",
  INVENTORY_WRITE: "inventory:write",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [STAFF_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [STAFF_ROLES.ADMIN]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_WRITE,
    PERMISSIONS.PATIENTS_DELETE,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.MEDICATIONS_WRITE,
    PERMISSIONS.MEDICATIONS_PRESCRIBE,
    PERMISSIONS.MEDICATIONS_DISPENSE,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.ASSESSMENTS_WRITE,
    PERMISSIONS.TREATMENT_PLANS_READ,
    PERMISSIONS.TREATMENT_PLANS_WRITE,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.PROGRESS_NOTES_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_WRITE,
    PERMISSIONS.APPOINTMENTS_SCHEDULE,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.STAFF_WRITE,
    PERMISSIONS.STAFF_ADMIN,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.COMPLIANCE_WRITE,
    PERMISSIONS.SYSTEM_ADMIN,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_WRITE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
  ],

  [STAFF_ROLES.DOCTOR]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_WRITE,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.MEDICATIONS_WRITE,
    PERMISSIONS.MEDICATIONS_PRESCRIBE,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.ASSESSMENTS_WRITE,
    PERMISSIONS.TREATMENT_PLANS_READ,
    PERMISSIONS.TREATMENT_PLANS_WRITE,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.PROGRESS_NOTES_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_WRITE,
  ],

  [STAFF_ROLES.RN]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_WRITE,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.MEDICATIONS_WRITE,
    PERMISSIONS.MEDICATIONS_DISPENSE,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.PROGRESS_NOTES_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
  ],

  [STAFF_ROLES.LPN]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.MEDICATIONS_DISPENSE,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.PROGRESS_NOTES_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
  ],

  [STAFF_ROLES.DISPENSING_NURSE]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.MEDICATIONS_DISPENSE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
  ],

  [STAFF_ROLES.PHARMACIST]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.MEDICATIONS_WRITE,
    PERMISSIONS.MEDICATIONS_DISPENSE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
  ],

  [STAFF_ROLES.COUNSELOR]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_WRITE,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.ASSESSMENTS_WRITE,
    PERMISSIONS.TREATMENT_PLANS_READ,
    PERMISSIONS.TREATMENT_PLANS_WRITE,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.PROGRESS_NOTES_WRITE,
  ],

  [STAFF_ROLES.CASE_MANAGER]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_WRITE,
    PERMISSIONS.APPOINTMENTS_SCHEDULE,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.TREATMENT_PLANS_READ,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.PROGRESS_NOTES_WRITE,
  ],

  [STAFF_ROLES.PEER_RECOVERY]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.PROGRESS_NOTES_WRITE,
    PERMISSIONS.TREATMENT_PLANS_READ,
  ],

  [STAFF_ROLES.MEDICAL_ASSISTANT]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_WRITE,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_SCHEDULE,
    PERMISSIONS.ASSESSMENTS_READ,
  ],

  [STAFF_ROLES.INTAKE]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_SCHEDULE,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.ASSESSMENTS_WRITE,
  ],

  [STAFF_ROLES.FRONT_DESK]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_WRITE,
    PERMISSIONS.APPOINTMENTS_SCHEDULE,
  ],

  [STAFF_ROLES.BILLING]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.BILLING_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
  ],

  [STAFF_ROLES.SUPERVISOR]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.PATIENTS_WRITE,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.ASSESSMENTS_WRITE,
    PERMISSIONS.TREATMENT_PLANS_READ,
    PERMISSIONS.TREATMENT_PLANS_WRITE,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.PROGRESS_NOTES_WRITE,
    PERMISSIONS.APPOINTMENTS_READ,
    PERMISSIONS.APPOINTMENTS_WRITE,
    PERMISSIONS.STAFF_READ,
    PERMISSIONS.COMPLIANCE_READ,
  ],

  [STAFF_ROLES.GENERAL_STAFF]: [PERMISSIONS.PATIENTS_READ, PERMISSIONS.APPOINTMENTS_READ],

  // Regulatory roles
  [REGULATORY_ROLES.DEA_INSPECTOR]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.REGULATORY_ACCESS,
    PERMISSIONS.INVENTORY_READ,
  ],

  [REGULATORY_ROLES.JOINT_COMMISSION_SURVEYOR]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.TREATMENT_PLANS_READ,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.REGULATORY_ACCESS,
  ],

  [REGULATORY_ROLES.STATE_INSPECTOR]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.REGULATORY_ACCESS,
  ],

  [REGULATORY_ROLES.COMPLIANCE_OFFICER]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.TREATMENT_PLANS_READ,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.COMPLIANCE_READ,
    PERMISSIONS.COMPLIANCE_WRITE,
    PERMISSIONS.STAFF_READ,
  ],

  [REGULATORY_ROLES.READ_ONLY_AUDITOR]: [
    PERMISSIONS.PATIENTS_READ,
    PERMISSIONS.MEDICATIONS_READ,
    PERMISSIONS.ASSESSMENTS_READ,
    PERMISSIONS.TREATMENT_PLANS_READ,
    PERMISSIONS.PROGRESS_NOTES_READ,
    PERMISSIONS.COMPLIANCE_READ,
  ],
}

// Utility functions for role checking
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole]
  return rolePermissions?.includes(permission) || false
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission))
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission))
}

export function canAccessResource(
  userRole: UserRole,
  resource: string,
  action: "read" | "write" | "delete" | "admin",
): boolean {
  const permission = `${resource}:${action}` as Permission
  return hasPermission(userRole, permission)
}

export function isStaffRole(role: string): role is StaffRole {
  return Object.values(STAFF_ROLES).includes(role as StaffRole)
}

export function isRegulatoryRole(role: string): role is RegulatoryRole {
  return Object.values(REGULATORY_ROLES).includes(role as RegulatoryRole)
}

export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    [STAFF_ROLES.SUPER_ADMIN]: "Super Administrator",
    [STAFF_ROLES.ADMIN]: "Administrator",
    [STAFF_ROLES.DOCTOR]: "Doctor/Physician",
    [STAFF_ROLES.RN]: "Registered Nurse (RN)",
    [STAFF_ROLES.LPN]: "Licensed Practical Nurse (LPN)",
    [STAFF_ROLES.DISPENSING_NURSE]: "Dispensing Nurse",
    [STAFF_ROLES.PHARMACIST]: "Pharmacist",
    [STAFF_ROLES.COUNSELOR]: "Counselor",
    [STAFF_ROLES.CASE_MANAGER]: "Case Manager",
    [STAFF_ROLES.PEER_RECOVERY]: "Peer Recovery Specialist",
    [STAFF_ROLES.MEDICAL_ASSISTANT]: "Medical Assistant",
    [STAFF_ROLES.INTAKE]: "Intake Specialist",
    [STAFF_ROLES.FRONT_DESK]: "Front Desk",
    [STAFF_ROLES.BILLING]: "Billing Specialist",
    [STAFF_ROLES.SUPERVISOR]: "Clinical Supervisor",
    [STAFF_ROLES.GENERAL_STAFF]: "General Staff",
    [REGULATORY_ROLES.DEA_INSPECTOR]: "DEA Inspector",
    [REGULATORY_ROLES.JOINT_COMMISSION_SURVEYOR]: "Joint Commission Surveyor",
    [REGULATORY_ROLES.STATE_INSPECTOR]: "State Inspector",
    [REGULATORY_ROLES.COMPLIANCE_OFFICER]: "Compliance Officer",
    [REGULATORY_ROLES.READ_ONLY_AUDITOR]: "Read-Only Auditor",
  }

  return roleNames[role] || role
}

export function getLicenseTypeDisplayName(licenseType: string): string {
  const licenseNames: Record<string, string> = {
    MD: "Doctor of Medicine (MD)",
    DO: "Doctor of Osteopathy (DO)",
    NP: "Nurse Practitioner (NP)",
    PA: "Physician Assistant (PA)",
    RN: "Registered Nurse (RN)",
    LPN: "Licensed Practical Nurse (LPN)",
    LCSW: "Licensed Clinical Social Worker (LCSW)",
    LMSW: "Licensed Master Social Worker (LMSW)",
    LPC: "Licensed Professional Counselor (LPC)",
    LPCC: "Licensed Professional Clinical Counselor (LPCC)",
    LCDC: "Licensed Chemical Dependency Counselor (LCDC)",
    CADC: "Certified Alcohol and Drug Counselor (CADC)",
    CPS: "Certified Peer Specialist (CPS)",
    CPRS: "Certified Peer Recovery Specialist (CPRS)",
    CMA: "Certified Medical Assistant (CMA)",
    PharmD: "Doctor of Pharmacy (PharmD)",
    RPh: "Registered Pharmacist (RPh)",
    None: "No License Required",
  }

  return licenseNames[licenseType] || licenseType
}
