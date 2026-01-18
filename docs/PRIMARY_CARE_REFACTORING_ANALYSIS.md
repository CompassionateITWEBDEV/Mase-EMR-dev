# Primary Care Page Comprehensive Analysis

## Executive Summary

This document provides a comprehensive analysis of the `/specialty/primary-care` page and all related code throughout the MASE Behavioral Health EMR codebase. The analysis identifies code quality issues, architectural problems, and provides a detailed multi-phase refactoring roadmap.

### Key Findings

| Category                 | Count | Severity |
| ------------------------ | ----- | -------- |
| Type Safety Issues       | 8     | High     |
| Mock/Static Data Usage   | 6     | High     |
| Missing API Integration  | 4     | High     |
| Code Duplication         | 5     | Medium   |
| Missing Type Definitions | 7     | Medium   |
| Incomplete Features      | 3     | Low      |

### Primary Files Analyzed

| File                                  | Lines | Purpose                          | Issues Found |
| ------------------------------------- | ----- | -------------------------------- | ------------ |
| `app/specialty/[id]/page.tsx`         | 862   | Dynamic specialty route          | 3            |
| `app/primary-care-dashboard/page.tsx` | 1062  | Dedicated primary care dashboard | 7            |
| `app/api/specialty-config/route.ts`   | 89    | Specialty configuration API      | 2            |
| `app/api/quality-measures/route.ts`   | 106   | Quality measures API             | 1            |

---

## 1. Architecture Overview

### Current Route Structure

```
/specialty/primary-care     → app/specialty/[id]/page.tsx (dynamic route)
/primary-care-dashboard     → app/primary-care-dashboard/page.tsx (dedicated page)
```

### Data Flow (Current - Problematic)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  app/specialty/[id]/page.tsx                                    │
│  ├── Uses HARDCODED specialtyConfigs object (669 lines)         │
│  ├── NO API calls to /api/specialty-config                      │
│  └── NO database integration                                     │
│                                                                  │
│  app/primary-care-dashboard/page.tsx                            │
│  ├── Uses MOCK data for all features                            │
│  ├── AI analysis uses setTimeout() simulation                   │
│  ├── NO API calls to /api/ai-clinical-assistant                 │
│  └── NO database integration                                     │
│                                                                  │
│  API Routes (EXIST but UNUSED by pages)                         │
│  ├── /api/specialty-config → clinic_specialty_configuration     │
│  ├── /api/quality-measures → quality_measures                   │
│  └── /api/ai-clinical-assistant → Real AI analysis              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Desired Data Flow (Target Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TARGET ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Pages                                                           │
│  ├── app/specialty/[id]/page.tsx                                │
│  └── app/primary-care-dashboard/page.tsx                        │
│           │                                                      │
│           ▼                                                      │
│  Custom Hooks (React Query)                                      │
│  ├── useSpecialtyConfig()                                       │
│  ├── useQualityMeasures()                                       │
│  ├── useAppointments()                                          │
│  ├── useClinicalAlerts()                                        │
│  └── useAIAssistant()                                           │
│           │                                                      │
│           ▼                                                      │
│  API Routes                                                      │
│  ├── /api/specialty-config                                      │
│  ├── /api/quality-measures                                      │
│  ├── /api/appointments                                          │
│  ├── /api/clinical-alerts                                       │
│  └── /api/ai-clinical-assistant                                 │
│           │                                                      │
│           ▼                                                      │
│  Supabase Database                                               │
│  ├── clinic_specialty_configuration                             │
│  ├── specialty_features                                         │
│  ├── quality_measures                                           │
│  ├── appointments                                               │
│  └── patients                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Code Quality Issues

### 2.1 Type Safety Issues (High Priority)

#### Issue 1: `icon: any` in Specialty Configs

**File:** `app/specialty/[id]/page.tsx:36`

```typescript
// CURRENT (Bad)
const specialtyConfigs: Record<
  string,
  {
    name: string;
    icon: any; // ❌ Using 'any' type
    // ...
  }
>;
```

**Fix:** Create proper type for Lucide icons

```typescript
import type { LucideIcon } from "lucide-react";

interface SpecialtyConfig {
  name: string;
  icon: LucideIcon; // ✅ Proper type
  // ...
}
```

#### Issue 2: `aiRecommendations: any` in Primary Care Dashboard

**File:** `app/primary-care-dashboard/page.tsx:117`

```typescript
// CURRENT (Bad)
const [aiRecommendations, setAiRecommendations] = useState<any>(null);
```

**Fix:** Create proper interface for AI recommendations

```typescript
interface AIRecommendations {
  summary: string;
  riskAlerts: RiskAlert[];
  recommendations: Recommendation[];
  drugInteractions: DrugInteractionResult;
  labOrders: LabOrder[];
  differentialDiagnosis: Diagnosis[];
  preventiveGaps: PreventiveGap[];
  educationTopics: string[];
}
```

#### Issue 3: `error: any` in API Route Catch Blocks

**Files:**

- `app/api/specialty-config/route.ts:35, 84`
- Multiple other API routes

```typescript
// CURRENT (Bad)
} catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 })
}
```

**Fix:** Use proper error typing

```typescript
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  return NextResponse.json({ error: message }, { status: 500 })
}
```

### 2.2 Mock/Static Data Issues (High Priority)

#### Issue 4: All Data in Primary Care Dashboard is Hardcoded

**File:** `app/primary-care-dashboard/page.tsx`

| Data                  | Lines  | Should Fetch From        |
| --------------------- | ------ | ------------------------ |
| `todaySchedule`       | 53-58  | `/api/appointments`      |
| `alerts`              | 60-64  | `/api/clinical-alerts`   |
| `primaryCareCPTCodes` | 66-96  | `/api/billing/cpt-codes` |
| `assessmentTools`     | 98-109 | `/api/assessments/tools` |
| `stats`               | 46-51  | `/api/dashboard/stats`   |

#### Issue 5: AI Analysis Uses Simulated API Call

**File:** `app/primary-care-dashboard/page.tsx:120-220`

```typescript
// CURRENT (Bad) - Simulates API call with setTimeout
const analyzePatientChart = async (patientId: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1500)); // Fake delay
  const dummyData = {
    /* hardcoded response */
  };
  setAiRecommendations(dummyData);
};
```

**Fix:** Use actual API endpoint

```typescript
const analyzePatientChart = async (patientId: string) => {
  const response = await fetch("/api/ai-clinical-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientId }),
  });
  const data = await response.json();
  setAiRecommendations(data);
};
```

#### Issue 6: Specialty Page Uses Hardcoded Config Instead of API

**File:** `app/specialty/[id]/page.tsx:32-700`

The page contains 669 lines of hardcoded specialty configuration data instead of fetching from `/api/specialty-config`.

### 2.3 Missing Type Definitions (Medium Priority)

| Missing Type       | Should Be In               | Used By                         |
| ------------------ | -------------------------- | ------------------------------- |
| `SpecialtyConfig`  | `types/specialty.ts`       | specialty/[id]/page.tsx         |
| `QualityMeasure`   | `types/quality-measure.ts` | quality-dashboard, primary-care |
| `CPTCode`          | `types/billing.ts`         | primary-care-dashboard          |
| `ClinicalAlert`    | `types/clinical.ts`        | primary-care-dashboard          |
| `AIRecommendation` | `types/ai-assistant.ts`    | primary-care-dashboard          |
| `AssessmentTool`   | `types/assessment.ts`      | primary-care-dashboard          |
| `ScheduleItem`     | `types/schedule.ts`        | primary-care-dashboard          |

### 2.4 Code Duplication (Medium Priority)

| Duplicated Code          | Locations                                    | Solution                               |
| ------------------------ | -------------------------------------------- | -------------------------------------- |
| Specialty config data    | specialty/[id]/page.tsx, database            | Use database as source of truth        |
| QualityMeasure interface | joint-commission/page.tsx, quality-dashboard | Centralize in types/quality-measure.ts |
| BillingCode interface    | pt-ot-dashboard, primary-care-dashboard      | Centralize in types/billing.ts         |
| Protocol interface       | clinical-protocols-dashboard.tsx             | Move to types/clinical.ts              |
| Dashboard layout pattern | Multiple dashboard pages                     | Create DashboardLayout component       |

### 2.5 Incomplete Features (Low Priority)

| Feature                 | File                       | Status                    |
| ----------------------- | -------------------------- | ------------------------- |
| Patients Tab            | primary-care-dashboard:380 | "coming soon" placeholder |
| Schedule Tab            | primary-care-dashboard:393 | "coming soon" placeholder |
| Some specialty features | specialty/[id]/page.tsx    | Static display only       |

---

## 3. Database Schema Analysis

### Existing Tables (from SQL scripts)

```sql
-- Specialty Configuration
clinic_specialty_configuration (
  id UUID PRIMARY KEY,
  clinic_id UUID,
  specialty_id VARCHAR(100),
  enabled BOOLEAN,
  configured_at TIMESTAMP,
  custom_settings JSONB
)

specialty_features (
  id UUID PRIMARY KEY,
  specialty_id VARCHAR(100),
  feature_code VARCHAR(100),
  feature_name VARCHAR(255),
  description TEXT,
  is_core_feature BOOLEAN
)

-- Quality Measures
quality_measures (
  id UUID PRIMARY KEY,
  measure_id VARCHAR,
  measure_name VARCHAR,
  measure_type VARCHAR,
  specialty VARCHAR,
  description TEXT,
  numerator_criteria TEXT,
  denominator_criteria TEXT,
  is_active BOOLEAN,
  high_priority BOOLEAN
)

quality_measure_tracking (
  id UUID PRIMARY KEY,
  measure_id UUID,
  patient_id UUID,
  encounter_id UUID,
  reporting_year INTEGER,
  in_numerator BOOLEAN,
  in_denominator BOOLEAN,
  excluded BOOLEAN,
  performance_met BOOLEAN
)
```

### Missing Tables/Columns

| Table                     | Missing For                        | Priority |
| ------------------------- | ---------------------------------- | -------- |
| `specialty_workflows`     | Workflow definitions per specialty | Medium   |
| `specialty_templates`     | Document templates per specialty   | Medium   |
| `specialty_billing_codes` | CPT codes per specialty            | High     |
| `clinical_alerts`         | Real-time clinical alerts          | High     |

---

## 4. API Route Analysis

### Existing Routes

| Route                        | Methods   | Database Tables                                        | Issues                             |
| ---------------------------- | --------- | ------------------------------------------------------ | ---------------------------------- |
| `/api/specialty-config`      | GET, POST | clinic_specialty_configuration, specialty_features     | N+1 query in POST                  |
| `/api/quality-measures`      | GET, POST | quality_measures, quality_measure_tracking             | None                               |
| `/api/ai-clinical-assistant` | POST      | patients, medications, vitals, labs                    | Not used by primary-care-dashboard |
| `/api/clinical-protocols`    | GET, POST | clinical_protocols, cows_assessments, ciwa_assessments | None                               |

### Missing Routes

| Route                    | Purpose                           | Priority |
| ------------------------ | --------------------------------- | -------- |
| `/api/appointments`      | Fetch today's schedule            | High     |
| `/api/clinical-alerts`   | Fetch patient alerts              | High     |
| `/api/billing/cpt-codes` | Fetch CPT codes by specialty      | Medium   |
| `/api/assessments/tools` | Fetch assessment tool definitions | Medium   |
| `/api/dashboard/stats`   | Fetch dashboard statistics        | Medium   |

---

## 5. Dependency Graph

```mermaid
graph TB
    subgraph "Pages"
        A["/specialty/primary-care<br/>app/specialty/[id]/page.tsx"]
        B["/primary-care-dashboard<br/>app/primary-care-dashboard/page.tsx"]
    end

    subgraph "Shared Components"
        C[DashboardSidebar]
        D[DashboardHeader]
        E[UI Components<br/>Card, Tabs, Badge, Button, etc.]
    end

    subgraph "Hooks (Missing)"
        F[useSpecialtyConfig]
        G[useQualityMeasures]
        H[useAppointments]
        I[useClinicalAlerts]
        J[useAIAssistant]
    end

    subgraph "API Routes"
        K[/api/specialty-config]
        L[/api/quality-measures]
        M[/api/ai-clinical-assistant]
        N[/api/appointments - MISSING]
        O[/api/clinical-alerts - MISSING]
    end

    subgraph "Database Tables"
        P[(clinic_specialty_configuration)]
        Q[(specialty_features)]
        R[(quality_measures)]
        S[(appointments)]
        T[(patients)]
    end

    A --> C
    A --> D
    A --> E
    B --> C
    B --> D
    B --> E

    A -.->|Should Use| F
    B -.->|Should Use| G
    B -.->|Should Use| H
    B -.->|Should Use| I
    B -.->|Should Use| J

    F --> K
    G --> L
    H --> N
    I --> O
    J --> M

    K --> P
    K --> Q
    L --> R
    N --> S
    M --> T

    style A fill:#ffcccc
    style B fill:#ffcccc
    style F fill:#ffffcc
    style G fill:#ffffcc
    style H fill:#ffffcc
    style I fill:#ffffcc
    style J fill:#ffffcc
    style N fill:#ffffcc
    style O fill:#ffffcc
```

**Legend:**

- 🔴 Red: Pages with issues
- 🟡 Yellow: Missing components/routes

---

## 6. Prioritized Task List

### Phase 1: Type System Foundation (Week 1)

**Estimated Effort: 8-12 hours**

| #   | Task                                                                          | Priority | Complexity | Files Affected          |
| --- | ----------------------------------------------------------------------------- | -------- | ---------- | ----------------------- |
| 1.1 | Create `types/specialty.ts` with SpecialtyConfig, SpecialtyFeature interfaces | High     | Low        | New file                |
| 1.2 | Create `types/billing.ts` with CPTCode, BillingClaim interfaces               | High     | Low        | New file                |
| 1.3 | Create `types/clinical.ts` with ClinicalAlert, Protocol interfaces            | High     | Low        | New file                |
| 1.4 | Create `types/ai-assistant.ts` with AIRecommendation interfaces               | High     | Low        | New file                |
| 1.5 | Create `types/schedule.ts` with Appointment, ScheduleItem interfaces          | Medium   | Low        | New file                |
| 1.6 | Fix `icon: any` → `LucideIcon` in specialty configs                           | High     | Low        | specialty/[id]/page.tsx |
| 1.7 | Fix `error: any` in all API route catch blocks                                | Medium   | Low        | 20+ API routes          |

### Phase 2: Custom Hooks (Week 2)

**Estimated Effort: 16-20 hours**

| #   | Task                                        | Priority | Complexity | Files Affected |
| --- | ------------------------------------------- | -------- | ---------- | -------------- |
| 2.1 | Create `hooks/use-specialty-config.ts`      | High     | Medium     | New file       |
| 2.2 | Create `hooks/use-quality-measures.ts`      | High     | Medium     | New file       |
| 2.3 | Create `hooks/use-appointments.ts`          | High     | Medium     | New file       |
| 2.4 | Create `hooks/use-clinical-alerts.ts`       | High     | Medium     | New file       |
| 2.5 | Create `hooks/use-ai-assistant.ts`          | High     | Medium     | New file       |
| 2.6 | Add query keys to `lib/utils/query-keys.ts` | Medium   | Low        | query-keys.ts  |

### Phase 3: API Route Enhancements (Week 2-3)

**Estimated Effort: 12-16 hours**

| #   | Task                                          | Priority | Complexity | Files Affected            |
| --- | --------------------------------------------- | -------- | ---------- | ------------------------- |
| 3.1 | Create `/api/appointments` route              | High     | Medium     | New file                  |
| 3.2 | Create `/api/clinical-alerts` route           | High     | Medium     | New file                  |
| 3.3 | Create `/api/billing/cpt-codes` route         | Medium   | Medium     | New file                  |
| 3.4 | Fix N+1 query in `/api/specialty-config` POST | Medium   | Low        | specialty-config/route.ts |
| 3.5 | Add proper error typing to all routes         | Medium   | Low        | 20+ files                 |

### Phase 4: Page Refactoring (Week 3-4)

**Estimated Effort: 24-32 hours**

| #   | Task                                                   | Priority | Complexity | Files Affected                  |
| --- | ------------------------------------------------------ | -------- | ---------- | ------------------------------- |
| 4.1 | Refactor specialty/[id]/page.tsx to use API            | High     | High       | specialty/[id]/page.tsx         |
| 4.2 | Replace mock data in primary-care-dashboard with hooks | High     | High       | primary-care-dashboard/page.tsx |
| 4.3 | Connect AI assistant to real API                       | High     | Medium     | primary-care-dashboard/page.tsx |
| 4.4 | Implement Patients tab with real data                  | Medium   | Medium     | primary-care-dashboard/page.tsx |
| 4.5 | Implement Schedule tab with real data                  | Medium   | Medium     | primary-care-dashboard/page.tsx |
| 4.6 | Extract tab content into separate components           | Medium   | Medium     | New component files             |

### Phase 5: Database Schema Updates (Week 4)

**Estimated Effort: 8-12 hours**

| #   | Task                                   | Priority | Complexity | Files Affected  |
| --- | -------------------------------------- | -------- | ---------- | --------------- |
| 5.1 | Create `specialty_billing_codes` table | High     | Medium     | SQL migration   |
| 5.2 | Create `clinical_alerts` table         | High     | Medium     | SQL migration   |
| 5.3 | Seed primary care CPT codes            | Medium   | Low        | SQL seed script |
| 5.4 | Seed primary care features             | Medium   | Low        | SQL seed script |

---

## 7. Multi-Phase Implementation Roadmap

```
Week 1                    Week 2                    Week 3                    Week 4
├─────────────────────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┤
│                         │                         │                         │                         │
│  PHASE 1: Types         │  PHASE 2: Hooks         │  PHASE 4: Pages         │  PHASE 5: Database      │
│  ─────────────────      │  ─────────────────      │  ─────────────────      │  ─────────────────      │
│  • Create type files    │  • Create custom hooks  │  • Refactor specialty   │  • Create new tables    │
│  • Fix any types        │  • Add query keys       │    page                 │  • Seed data            │
│  • Fix error handling   │                         │  • Refactor primary     │  • Verify migrations    │
│                         │  PHASE 3: APIs          │    care dashboard       │                         │
│                         │  ─────────────────      │  • Extract components   │                         │
│                         │  • Create new routes    │                         │                         │
│                         │  • Fix existing routes  │                         │                         │
│                         │                         │                         │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┘

Total Estimated Effort: 68-92 hours (2-3 developer weeks)
```

---

## 8. Risk Assessment

| Risk                                               | Impact | Likelihood | Mitigation                                          |
| -------------------------------------------------- | ------ | ---------- | --------------------------------------------------- |
| Database schema changes break existing features    | High   | Medium     | Create migrations with rollback, test thoroughly    |
| API changes break other pages using same endpoints | High   | Low        | Version APIs or ensure backward compatibility       |
| Large page refactoring introduces bugs             | Medium | High       | Incremental changes, comprehensive testing          |
| Missing data in database for new features          | Medium | Medium     | Create seed scripts, handle empty states gracefully |

---

## 9. Success Criteria

- [ ] All `any` types replaced with proper TypeScript interfaces
- [ ] Primary care dashboard fetches real data from APIs
- [ ] Specialty page fetches configuration from database
- [ ] AI assistant uses real `/api/ai-clinical-assistant` endpoint
- [ ] All new hooks have proper error handling and loading states
- [ ] No TypeScript compilation errors
- [ ] All existing tests pass
- [ ] New unit tests for hooks and API routes

---

## 10. Files Reference

### Files to Create

```
types/
├── specialty.ts          # SpecialtyConfig, SpecialtyFeature
├── billing.ts            # CPTCode, BillingClaim
├── clinical.ts           # ClinicalAlert, Protocol
├── ai-assistant.ts       # AIRecommendation, RiskAlert
└── schedule.ts           # Appointment, ScheduleItem

hooks/
├── use-specialty-config.ts
├── use-quality-measures.ts
├── use-appointments.ts
├── use-clinical-alerts.ts
└── use-ai-assistant.ts

app/api/
├── appointments/route.ts
├── clinical-alerts/route.ts
└── billing/cpt-codes/route.ts

scripts/
├── create_specialty_billing_codes.sql
└── create_clinical_alerts.sql
```

### Files to Modify

```
app/specialty/[id]/page.tsx           # Replace hardcoded config with API
app/primary-care-dashboard/page.tsx   # Replace mock data with hooks
app/api/specialty-config/route.ts     # Fix N+1 query
lib/utils/query-keys.ts               # Add new query keys
20+ API routes                        # Fix error: any typing
```

---

_Document generated: 2025-12-29_
_Analysis scope: /specialty/primary-care and related code_
| `/api/clinical-protocols` | GET, POST | clinical_protocols, cows_assessments, ciwa_assessments | None |

### Missing Routes

| Route                    | Purpose                           | Priority |
| ------------------------ | --------------------------------- | -------- |
| `/api/appointments`      | Fetch today's schedule            | High     |
| `/api/clinical-alerts`   | Fetch patient alerts              | High     |
| `/api/billing/cpt-codes` | Fetch CPT codes by specialty      | Medium   |
| `/api/assessments/tools` | Fetch assessment tool definitions | Medium   |
| `/api/dashboard/stats`   | Fetch dashboard statistics        | Medium   |
