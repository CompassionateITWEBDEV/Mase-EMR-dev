import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to define mock data before mocks are hoisted
const { mockAIResponse, mockPatientContext, mockNoteSummary, mockComplianceResult } = vi.hoisted(() => {
  const mockAIResponse = {
    summary: "Patient assessment completed",
    riskAlerts: [],
    recommendations: [
      {
        text: "Continue current medication regimen",
        priority: "medium" as const,
        category: "medication" as const,
      },
    ],
    drugInteractions: {
      status: "no_major" as const,
      message: "No major drug interactions detected",
    },
    labOrders: [],
    differentialDiagnosis: [],
    preventiveGaps: [],
    educationTopics: [],
  };

  const mockPatientContext = {
    structured: {
      demographics: {
        id: "p1",
        first_name: "John",
        last_name: "Doe",
        date_of_birth: "1970-01-15",
        gender: "male",
        age: 54,
      },
      medications: [
        {
          id: "m1",
          medication_name: "Lisinopril",
          dosage: "10mg",
          frequency: "daily",
          status: "active",
        },
      ],
      problems: [],
      allergies: [],
      labResults: [],
      vitalSigns: [],
      encounters: [],
      treatmentPlans: [],
    },
    unstructured: {
      recentNotes: [],
    },
  };

  const mockNoteSummary = {
    summary: "No significant findings",
    keyFindings: [],
    diagnoses: [],
    concerns: [],
    assessmentScores: {},
    missingDocumentation: [],
  };

  const mockComplianceResult = {
    overallCompliant: true,
    checks: [],
    summary: "All compliance checks passed",
  };

  return { mockAIResponse, mockPatientContext, mockNoteSummary, mockComplianceResult };
});

// Mock all service functions
vi.mock("@/lib/services/patient-data-aggregator", () => ({
  aggregatePatientContext: vi.fn().mockResolvedValue(mockPatientContext),
  formatPatientDataForPrompt: vi.fn().mockReturnValue("Mock patient data"),
}));

vi.mock("@/lib/services/note-processor", () => ({
  processClinicalNotes: vi.fn().mockResolvedValue({
    summary: mockNoteSummary,
  }),
}));

vi.mock("@/lib/services/specialty-recommendations", () => ({
  generateSpecialtyRecommendations: vi.fn().mockReturnValue([]),
  formatSpecialtyRecommendations: vi.fn().mockReturnValue(""),
}));

vi.mock("@/lib/services/risk-calculators", () => ({
  calculateAllRiskScores: vi.fn().mockReturnValue({}),
  formatRiskScores: vi.fn().mockReturnValue(""),
}));

vi.mock("@/lib/services/rate-limiter", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    remaining: 100,
    resetAt: new Date(Date.now() + 3600000),
    limit: 100,
  }),
  recordRequest: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/ai-cache", () => ({
  getCachedAnalysis: vi.fn().mockResolvedValue(null),
  cacheAnalysis: vi.fn().mockResolvedValue(undefined),
  generateDataHash: vi.fn().mockReturnValue("mock-hash"),
}));

vi.mock("@/lib/services/ai-feedback", () => ({
  logRecommendation: vi.fn().mockResolvedValue("mock-recommendation-id"),
}));

vi.mock("@/lib/services/compliance-checker", () => ({
  checkCompliance: vi.fn().mockReturnValue(mockComplianceResult),
}));

vi.mock("@/lib/services/role-context", () => ({
  normalizeRole: vi.fn().mockReturnValue("provider"),
  getRoleFocusAreas: vi.fn().mockReturnValue([]),
  getRoleSystemPromptAddition: vi.fn().mockReturnValue(""),
}));

vi.mock("@/lib/prompts/specialty-prompts", () => ({
  generateSpecialtyPrompt: vi.fn().mockReturnValue({
    systemPrompt: "Mock system prompt",
    userPrompt: "Mock user prompt",
  }),
}));

vi.mock("ai", () => ({
  generateText: vi.fn().mockResolvedValue({
    text: JSON.stringify(mockAIResponse),
  }),
}));

vi.mock("@/lib/auth/middleware", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", email: "test@example.com" },
    error: null,
  }),
}));

import { GET, POST } from "@/app/api/ai-assistant/route";
import { aggregatePatientContext } from "@/lib/services/patient-data-aggregator";

describe("GET /api/ai-assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default behavior
    vi.mocked(aggregatePatientContext).mockResolvedValue(mockPatientContext);
  });

  it("should return 400 if patientId is missing", async () => {
    const request = new Request("http://localhost/api/ai-assistant");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Patient ID");
  });

  it("should fetch AI recommendations successfully", async () => {
    const request = new Request(
      "http://localhost/api/ai-assistant?patientId=p1"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.patientId).toBe("p1");
    expect(data.recommendations).toBeDefined();
    expect(data.generatedAt).toBeDefined();
  });

  it("should return 404 if patient not found", async () => {
    // Mock aggregatePatientContext to throw an error when patient doesn't exist
    vi.mocked(aggregatePatientContext).mockRejectedValue({
      code: "PGRST116",
      message: "No rows found",
    });

    const request = new Request(
      "http://localhost/api/ai-assistant?patientId=invalid"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Patient not found");
  });
});

describe("POST /api/ai-assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default behavior
    vi.mocked(aggregatePatientContext).mockResolvedValue(mockPatientContext);
  });

  it("should return 400 if patientId is missing", async () => {
    const request = new Request("http://localhost/api/ai-assistant", {
      method: "POST",
      body: JSON.stringify({ analysisType: "medication_review" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Patient ID");
  });

  it("should request AI analysis successfully", async () => {
    const request = new Request("http://localhost/api/ai-assistant", {
      method: "POST",
      body: JSON.stringify({
        patientId: "p1",
        analysisType: "medication_review",
        chiefComplaint: "Chest pain",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.patientId).toBe("p1");
    expect(data.recommendations).toBeDefined();
    expect(data.generatedAt).toBeDefined();
  });

  it("should return 404 if patient not found", async () => {
    // Mock aggregatePatientContext to throw an error when patient doesn't exist
    vi.mocked(aggregatePatientContext).mockRejectedValue({
      code: "PGRST116",
      message: "No rows found",
    });

    const request = new Request("http://localhost/api/ai-assistant", {
      method: "POST",
      body: JSON.stringify({ patientId: "invalid" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Patient not found");
  });
});
