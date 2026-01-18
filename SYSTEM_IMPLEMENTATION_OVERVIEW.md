# MASE Behavioral Health EMR - System Implementation Overview

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Core Modules](#core-modules)
5. [Database Structure](#database-structure)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Authorization](#authentication--authorization)
8. [Key Features](#key-features)
9. [File Structure](#file-structure)
10. [Deployment](#deployment)

---

## System Overview

**MASE Behavioral Health EMR** is a comprehensive, multi-specialty Electronic Medical Record (EMR) system built as a Next.js application. It serves behavioral health clinics, primary care practices, rehabilitation services, county health departments, and other healthcare facilities through a unified, configurable platform.

### Key Characteristics:
- **Multi-tenant SaaS architecture** - Supports multiple organizations with data isolation
- **13+ medical specialties** - Behavioral health, primary care, PT/OT/Speech, county health, etc.
- **AI-powered features** - Clinical decision support, documentation assistance, coaching
- **Regulatory compliance** - HIPAA, 42 CFR Part 2, DEA, Joint Commission
- **Subscription-based** - Feature activation via subscription tiers

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.1 (React 19.2.3)
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS 4.1.18
- **State Management**: TanStack React Query 5.90.16, SWR 2.3.8
- **Forms**: React Hook Form 7.69.0 with Zod validation
- **Charts**: Recharts
- **PDF Generation**: jsPDF with autoTable plugin

### Backend
- **Runtime**: Next.js API Routes (Serverless functions)
- **Database**: Supabase (PostgreSQL) with Neon serverless driver
- **Authentication**: Supabase Auth with role-based access control (RBAC)
- **File Storage**: Supabase Storage

### AI/ML
- **AI SDK**: Vercel AI SDK 6.0.5
- **Features**: Clinical decision support, documentation assistance, behavioral health coaching

### Development Tools
- **Testing**: Vitest 4.0.16 with React Testing Library
- **Linting**: ESLint 9.39.2
- **Type Checking**: TypeScript 5.9.3
- **Package Manager**: pnpm

---

## Architecture

### Application Structure
```
MASE-EMR/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── api/               # API endpoints (53 route handlers)
│   ├── auth/              # Authentication pages (multiple login types)
│   ├── [feature-pages]/   # Feature-specific pages (80+ routes)
│   └── layout.tsx         # Root layout with providers
├── components/            # React components (120+ components)
│   ├── ui/               # Reusable UI primitives (Radix-based)
│   └── [feature]/        # Feature-specific components
├── lib/                   # Utility libraries
│   ├── supabase/         # Database clients (browser, server, service)
│   ├── auth/             # RBAC, roles, permissions
│   └── utils/            # Helper functions
├── types/                 # TypeScript type definitions
├── scripts/               # SQL migration scripts (83 files)
├── hooks/                 # Custom React hooks (14 hooks)
└── schemas/               # Zod validation schemas
```

### Data Flow
1. **Client Request** → Next.js Page/Component
2. **API Route** → Server-side handler (`app/api/*/route.ts`)
3. **Supabase Client** → Database query (`lib/supabase/*.ts`)
4. **PostgreSQL** → Data storage (Supabase)
5. **Response** → JSON data back to client

### Multi-Tenant Architecture
- **Organizations Table**: Each clinic/organization has isolated data
- **Row-Level Security (RLS)**: Supabase policies enforce data isolation
- **Subscription Tiers**: Feature flags control specialty activation

---

## Core Modules

### 1. Patient Management
- **Patient Registration**: Intake forms, demographics, insurance
- **Patient Chart**: Comprehensive medical record view
- **Patient Portal**: Patient-facing access to records, appointments
- **Patient Search**: Advanced filtering and search capabilities

**Key Files:**
- `app/patients/page.tsx` - Patient list
- `app/patients/[id]/page.tsx` - Patient detail
- `app/api/patients/route.ts` - Patient CRUD API
- `components/patient-list.tsx` - Patient listing component

### 2. Clinical Documentation
- **Clinical Notes**: Progress notes, assessments, treatment plans
- **Discharge Summaries**: Comprehensive discharge documentation
- **Assessments**: PHQ-9, GAD-7, COWS, CIWA, and custom assessments
- **AI Documentation Assistant**: Auto-populates notes from templates

**Key Files:**
- `app/clinical-notes/page.tsx`
- `app/clinical-documents/page.tsx`
- `app/api/clinical-notes/route.ts`
- `app/api/clinical-documents/route.ts`

### 3. Medication Management
- **Prescriptions**: E-prescribing with Surescripts integration
- **Medication Reconciliation**: Review and update medication lists
- **Drug Interactions**: Real-time interaction checking
- **Dispensing**: OTP-specific medication dispensing workflows

**Key Files:**
- `app/medications/page.tsx`
- `app/prescriptions/page.tsx`
- `app/e-prescribing/page.tsx`
- `app/api/medications/route.ts`

### 4. Appointment Scheduling
- **Calendar View**: Provider and facility scheduling
- **Appointment Types**: Initial, follow-up, therapy, medication management
- **Check-in System**: Patient check-in queue management
- **Reminders**: Automated appointment reminders

**Key Files:**
- `app/appointments/page.tsx`
- `app/check-in/page.tsx`
- `components/appointment-calendar.tsx`
- `app/api/appointments/route.ts`

### 5. Billing & Claims
- **Billing Center**: Claims management, ERA processing
- **Clearinghouse Integration**: EDI transaction processing
- **Insurance Verification**: Real-time eligibility checking
- **OTP Billing**: Specialized billing for opioid treatment programs

**Key Files:**
- `app/billing/page.tsx`
- `app/billing-center/page.tsx`
- `app/clearinghouse/page.tsx`
- `app/api/billing/route.ts`

### 6. Opioid Treatment Program (OTP)
- **Dosing Window**: Daily medication administration tracking
- **Takehome Management**: Takehome medication orders and diversion control
- **Bottle Changeover**: Serialized bottle tracking
- **Diversion Control**: QR code verification for takehome doses

**Key Files:**
- `app/dosing-window/page.tsx`
- `app/takehome/page.tsx`
- `app/takehome-diversion/page.tsx`
- `app/dispensing/page.tsx`

### 7. Regulatory & Compliance
- **DEA Compliance**: Form 222 tracking, diversion reports
- **Joint Commission**: Surveyor access, quality metrics
- **42 CFR Part 2**: Substance use disorder record protection
- **Compliance Reports**: Automated compliance reporting

**Key Files:**
- `app/regulatory/dashboard/page.tsx`
- `app/regulatory/dea/page.tsx`
- `app/regulatory/joint-commission/page.tsx`
- `app/compliance/page.tsx`

### 8. Primary Care Integration
- **Primary Care Dashboard**: E/M coding, preventive care
- **Chronic Care Management**: CCM patient tracking
- **Quality Metrics**: MIPS, HEDIS measures
- **Provider Collaboration**: Care team coordination

**Key Files:**
- `app/primary-care-dashboard/page.tsx`
- `app/api/primary-care/route.ts`
- `components/provider-collaboration.tsx`

### 9. Rehabilitation Services
- **PT/OT Dashboard**: Therapy session documentation
- **Home Exercise Programs (HEP)**: Patient exercise tracking
- **Remote Therapeutic Monitoring (RTM)**: Automated RTM billing
- **Functional Assessments**: Outcome measure tracking

**Key Files:**
- `app/pt-ot-dashboard/page.tsx`
- `app/rehabilitation/page.tsx`
- `app/api/rehabilitation/route.ts`

### 10. County Health Department
- **County Health Portal**: WIC, immunizations, STI clinics
- **Staff Education**: Training and certification tracking
- **AI Coaching**: County health-specific AI assistance

**Key Files:**
- `app/county-health/page.tsx`
- `app/health-dept-portal/dashboard/page.tsx`
- `app/api/county-health/route.ts`

### 11. Health Information Exchange (HIE)
- **MASE HIE Network**: Inter-clinic data sharing
- **Consent Management**: Patient consent tracking
- **Referrals**: Electronic referral system
- **Registry**: Population health registry

**Key Files:**
- `app/hie-network/page.tsx`
- `app/api/hie/route.ts`

### 12. AI Features
- **AI Clinical Assistant**: Documentation assistance
- **AI Behavioral Health Assistant**: Clinical decision support
- **AI Coaching**: Patient and staff coaching
- **Drug Interaction Checking**: AI-powered interaction analysis

**Key Files:**
- `app/ai-coaching/page.tsx`
- `app/api/ai-assistant/route.ts`
- `app/api/ai-clinical-assistant/route.ts`

### 13. Inventory Management
- **Medication Inventory**: Stock tracking, reorder points
- **DME Management**: Durable medical equipment tracking
- **Serial Device Monitoring**: Serialized medication tracking

**Key Files:**
- `app/inventory/page.tsx`
- `app/dme-management/page.tsx`
- `app/api/inventory/route.ts`

### 14. Reporting & Analytics
- **Advanced Reporting**: Custom report builder
- **Quality Dashboard**: Quality measure tracking
- **Analytics Dashboard**: System-wide analytics
- **System Reports**: Administrative reports

**Key Files:**
- `app/reports/page.tsx`
- `app/analytics/page.tsx`
- `app/quality-dashboard/page.tsx`
- `app/api/reports/route.ts`

---

## Database Structure

### Core Tables (PostgreSQL via Supabase)

#### Multi-Tenant Foundation
- `organizations` - Clinic/organization data
- `user_accounts` - User authentication and profiles
- `organization_memberships` - User-organization relationships

#### Patient Management
- `patients` - Patient demographics and basic info
- `patient_insurance` - Insurance information
- `patient_consents` - Consent form tracking

#### Clinical Data
- `providers` - Healthcare provider information
- `staff` - Non-provider staff members
- `appointments` - Appointment scheduling
- `encounters` - Clinical encounter records
- `clinical_notes` - Progress notes and documentation
- `assessments` - Clinical assessments (PHQ-9, GAD-7, etc.)
- `treatment_plans` - Treatment planning documents
- `discharge_summaries` - Discharge documentation

#### Medication Management
- `medications` - Medication master list
- `prescriptions` - Prescription orders
- `medication_orders` - Medication order requests
- `medication_reconciliation` - Medication reconciliation records
- `drug_interactions` - Drug interaction database

#### OTP-Specific
- `dispensing_orders` - Medication dispensing orders
- `dispensing_bottles` - Serialized bottle tracking
- `takehome_orders` - Takehome medication orders
- `takehome_kits` - Takehome kit management
- `diversion_control` - Diversion tracking and QR codes

#### Billing
- `insurance_payers` - Insurance payer database
- `claims` - Insurance claims
- `clearinghouse_transactions` - EDI transactions
- `era_transactions` - Electronic remittance advices

#### Regulatory
- `dea_compliance` - DEA compliance records
- `form_222` - DEA Form 222 tracking
- `joint_commission_reports` - Joint Commission reporting
- `compliance_audits` - Compliance audit records

#### Specialty-Specific
- `rehabilitation_sessions` - PT/OT/Speech sessions
- `hep_programs` - Home exercise programs
- `rtm_monitoring` - Remote therapeutic monitoring
- `county_health_encounters` - County health visits
- `chw_encounters` - Community health worker encounters

#### System
- `clinical_alerts` - Clinical decision support alerts
- `notifications` - System notifications
- `workflows` - Workflow definitions
- `workflow_tasks` - Task management
- `subscriptions` - Organization subscription plans
- `specialty_config` - Specialty configuration

### Database Setup
- **Migration Scripts**: 83 SQL files in `scripts/` directory
- **Master Setup**: `MASTER_COMPLETE_SETUP.sql` or `FINAL_LAUNCH_COMPLETE_SETUP.sql`
- **Row-Level Security**: RLS policies enforce multi-tenant isolation
- **Extensions**: UUID generation, encryption (pgcrypto)

---

## API Endpoints

### Authentication APIs
- `POST /api/auth/super-admin` - Super admin login
- `GET /api/auth/callback` - OAuth callback handler

### Patient APIs
- `GET /api/patients` - List patients (with filtering)
- `POST /api/patients` - Create patient
- `GET /api/patients/[id]` - Get patient details
- `PUT /api/patients/[id]` - Update patient
- `GET /api/patients/stats` - Patient statistics
- `GET /api/patients/list` - Patient list (paginated)

### Clinical APIs
- `GET /api/clinical-notes` - List clinical notes
- `POST /api/clinical-notes` - Create clinical note
- `POST /api/clinical-notes/ai-assist` - AI documentation assistance
- `GET /api/clinical-documents` - List clinical documents
- `POST /api/clinical-documents` - Create clinical document
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment
- `GET /api/assessments/tools` - Assessment tools library

### Medication APIs
- `GET /api/medications` - List medications
- `POST /api/medications` - Add medication
- `PUT /api/medications/[id]` - Update medication
- `POST /api/medications/[id]/discontinue` - Discontinue medication
- `GET /api/medications/interactions` - Check drug interactions
- `GET /api/prescriptions` - List prescriptions
- `POST /api/prescriptions` - Create prescription
- `POST /api/prescriptions/[id]/send` - Send prescription
- `POST /api/prescriptions/[id]/cancel` - Cancel prescription

### Appointment APIs
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/[id]` - Get appointment
- `PUT /api/appointments/[id]` - Update appointment

### Billing APIs
- `GET /api/billing` - Billing data
- `GET /api/billing/cpt-codes` - CPT code lookup
- `GET /api/claims` - List claims
- `POST /api/claims` - Submit claim
- `GET /api/clearinghouse` - Clearinghouse status
- `GET /api/insurance-verification` - Verify insurance

### OTP/Dispensing APIs
- `GET /api/dispensing/orders` - Dispensing orders
- `POST /api/dispensing/orders` - Create dispensing order
- `GET /api/dispensing/bottles` - Bottle inventory
- `GET /api/takehome/orders` - Takehome orders
- `POST /api/takehome/orders` - Create takehome order
- `POST /api/takehome/kits/[orderId]/issue` - Issue takehome kit
- `GET /api/takehome-diversion/verify-scan` - Verify QR code scan

### Regulatory APIs
- `GET /api/regulatory/reports` - Regulatory reports
- `GET /api/dea/sync` - DEA data sync
- `GET /api/joint-commission` - Joint Commission data
- `GET /api/form-222` - Form 222 records

### Dashboard APIs
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/metrics` - Quality metrics
- `GET /api/dashboard/activity` - Recent activity
- `GET /api/dashboard/work-queue` - Work queue items

### AI APIs
- `POST /api/ai-assistant` - General AI assistant
- `POST /api/ai-clinical-assistant` - Clinical AI assistant
- `POST /api/ai-behavioral-health-assistant` - Behavioral health AI
- `POST /api/ai-coaching/chat` - AI coaching chat
- `POST /api/ai-assistant/drug-interactions` - Drug interaction AI

### Integration APIs
- `GET /api/lab` - Lab results
- `POST /api/integrations/pdmp` - PDMP queries
- `POST /api/integrations/fax` - Fax integration
- `POST /api/integrations/sms` - SMS integration
- `GET /api/hie/registry` - HIE registry
- `POST /api/hie/referrals` - Create referral

**Total: 53+ API route handlers**

---

## Authentication & Authorization

### Authentication System
- **Provider**: Supabase Auth
- **Methods**: Email/password, OAuth (via Supabase)
- **Session Management**: Supabase session cookies

### Role-Based Access Control (RBAC)

#### Staff Roles (19 roles)
- `super_admin` - Full system access
- `admin` - Administrative access
- `doctor` - Physician/provider access
- `rn` - Registered nurse
- `lpn` - Licensed practical nurse
- `dispensing_nurse` - Medication dispensing
- `pharmacist` - Pharmacy operations
- `counselor` - Counseling services
- `case_manager` - Case management
- `peer_recovery` - Peer recovery specialist
- `medical_assistant` - Medical assistant
- `intake` - Intake specialist
- `front_desk` - Front desk staff
- `billing` - Billing specialist
- `supervisor` - Clinical supervisor
- `general_staff` - General staff access

#### Regulatory Roles (5 roles)
- `dea_inspector` - DEA inspection access
- `joint_commission_surveyor` - Joint Commission access
- `state_inspector` - State inspection access
- `compliance_officer` - Compliance management
- `read_only_auditor` - Read-only audit access

### Permissions System
Permissions are granular and role-based:
- `patients:read`, `patients:write`, `patients:delete`
- `medications:read`, `medications:write`, `medications:prescribe`, `medications:dispense`
- `assessments:read`, `assessments:write`
- `treatment_plans:read`, `treatment_plans:write`
- `progress_notes:read`, `progress_notes:write`
- `appointments:read`, `appointments:write`, `appointments:schedule`
- `staff:read`, `staff:write`, `staff:admin`
- `compliance:read`, `compliance:write`
- `regulatory:access`
- `billing:read`, `billing:write`
- `inventory:read`, `inventory:write`
- `system:admin`, `super:admin`

### Implementation Files
- `lib/auth/roles.ts` - Role and permission definitions
- `lib/auth/rbac-hooks.ts` - React hooks for permission checking
- `lib/auth/middleware.ts` - Authentication middleware
- `lib/supabase/middleware.ts` - Supabase middleware for route protection

---

## Key Features

### 1. Multi-Specialty Support
- Behavioral Health (OTP, MAT, counseling)
- Primary Care (E/M coding, preventive care)
- Rehabilitation (PT/OT/Speech, HEP, RTM)
- County Health (WIC, immunizations, STI clinics)
- Specialty configuration via subscription

### 2. AI-Powered Features
- **Clinical Documentation Assistant**: Auto-populates notes from templates
- **Drug Interaction Checking**: Real-time interaction analysis
- **Behavioral Health Coaching**: AI-powered patient coaching
- **Clinical Decision Support**: Alerts and recommendations

### 3. Regulatory Compliance
- **HIPAA**: Full HIPAA compliance with audit trails
- **42 CFR Part 2**: Substance use disorder record protection
- **DEA Compliance**: Form 222 tracking, diversion reports
- **Joint Commission**: Surveyor access, quality metrics
- **MIPS/HEDIS**: Quality measure tracking

### 4. Integration Capabilities
- **E-Prescribing**: Surescripts integration
- **Lab Integration**: HL7/FHIR lab result interfaces
- **PDMP**: Prescription Drug Monitoring Program queries
- **Clearinghouse**: EDI claims processing (837, 835)
- **HIE Network**: Inter-clinic data sharing
- **Fax/SMS**: Communication integrations

### 5. OTP-Specific Features
- **Dosing Window**: Daily medication administration
- **Takehome Management**: Takehome orders and tracking
- **Diversion Control**: QR code verification
- **Bottle Serialization**: Serialized bottle tracking
- **Bundle Calculator**: OTP billing calculations

### 6. Patient Portal
- Patient access to records
- Appointment scheduling
- Medication verification
- Document access
- Peer coach access

### 7. Reporting & Analytics
- Custom report builder
- Quality dashboards
- Compliance reports
- System analytics
- Advanced reporting

---

## File Structure

### App Directory (`app/`)
```
app/
├── api/                    # API routes (53 handlers)
│   ├── patients/
│   ├── medications/
│   ├── appointments/
│   ├── clinical-notes/
│   ├── billing/
│   ├── ai-assistant/
│   └── ...
├── auth/                   # Authentication pages
│   ├── login/
│   ├── register/
│   ├── provider-login/
│   ├── patient-login/
│   └── ...
├── patients/               # Patient management pages
├── appointments/           # Appointment pages
├── clinical-notes/         # Clinical documentation
├── medications/            # Medication management
├── billing/                # Billing pages
├── dosing-window/          # OTP dosing
├── regulatory/            # Regulatory pages
├── primary-care-dashboard/ # Primary care
├── pt-ot-dashboard/        # Rehabilitation
├── county-health/         # County health
└── layout.tsx             # Root layout
```

### Components Directory (`components/`)
```
components/
├── ui/                     # Reusable UI components (Radix-based)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── ...
├── patient/                # Patient-specific components
├── billing/                # Billing components
├── clinical/               # Clinical components
└── [feature]/             # Feature-specific components
```

### Library Directory (`lib/`)
```
lib/
├── supabase/              # Database clients
│   ├── client.ts         # Browser client
│   ├── server.ts         # Server client
│   └── service-role.ts   # Service role client
├── auth/                  # Authentication & RBAC
│   ├── roles.ts          # Role definitions
│   ├── rbac-hooks.ts     # Permission hooks
│   └── middleware.ts     # Auth middleware
├── utils/                 # Utility functions
│   ├── patient-helpers.ts
│   ├── query-keys.ts
│   └── ...
└── react-query/           # React Query provider
```

### Types Directory (`types/`)
```
types/
├── patient.ts            # Patient types
├── clinical.ts           # Clinical types
├── billing.ts            # Billing types
├── api.ts                # API types
└── ...
```

### Scripts Directory (`scripts/`)
```
scripts/
├── MASTER_COMPLETE_SETUP.sql    # Master database setup
├── 000_master_schema.sql        # Core schema
├── 001_create_core_tables.sql   # Core tables
├── create_multi_tenant_system.sql
├── create_specialty_configuration.sql
└── [80+ more SQL files]         # Feature-specific schemas
```

---

## Deployment

### Environment Variables
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side)

### Build & Run
```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Type checking
pnpm check:types

# Linting
pnpm lint

# Testing
pnpm test
pnpm test:coverage
```

### Database Setup
1. Create Supabase project
2. Run master setup script: `MASTER_COMPLETE_SETUP.sql`
3. Configure environment variables
4. Set up Row-Level Security policies

### Deployment Platforms
- **Vercel**: Primary deployment platform (configured)
- **Other**: Can deploy to any Node.js hosting platform

---

## Summary

**MASE Behavioral Health EMR** is a comprehensive, production-ready EMR system with:

- **336+ files** in the app directory
- **120+ React components**
- **53+ API endpoints**
- **83 SQL migration scripts**
- **13+ medical specialties** supported
- **24 user roles** with granular permissions
- **Multi-tenant architecture** with subscription management
- **AI-powered features** for clinical assistance
- **Full regulatory compliance** (HIPAA, 42 CFR Part 2, DEA, Joint Commission)
- **Extensive integrations** (E-prescribing, labs, PDMP, clearinghouse, HIE)

The system is built on modern web technologies (Next.js, React, TypeScript, Supabase) and follows best practices for security, scalability, and maintainability.
