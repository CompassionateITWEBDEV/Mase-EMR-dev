import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock patient data
const mockPatient = {
  id: "p1",
  first_name: "John",
  last_name: "Doe",
  date_of_birth: "1970-01-15",
  gender: "male",
};

// Mock medications
const mockMedications = [
  {
    id: "m1",
    medication_name: "Lisinopril",
    dosage: "10mg",
    frequency: "daily",
    status: "active",
  },
];

const { mockQueryBuilder, mockFrom, setMockResponses } = vi.hoisted(() => {
  let singleResponse: { data: unknown; error: unknown } = {
    data: null,
    error: null,
  };
  let limitResponse: { data: unknown[]; error: unknown } = {
    data: [],
    error: null,
  };

  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "order",
    "eq",
    "single",
    "limit",
  ];
  methods.forEach((method) => {
    builder[method] = vi.fn().mockImplementation(() => builder);
  });

  // single() returns patient data
  builder.single.mockImplementation(() => Promise.resolve(singleResponse));
  // limit() returns medications
  builder.limit.mockImplementation(() => Promise.resolve(limitResponse));

  return {
    mockQueryBuilder: builder,
    mockFrom: vi.fn().mockReturnValue(builder),
    setMockResponses: (
      single: { data: unknown; error: unknown },
      limit: { data: unknown[]; error: unknown }
    ) => {
      singleResponse = single;
      limitResponse = limit;
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}));

vi.mock("@/lib/auth/middleware", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", email: "test@example.com" },
    error: null,
  }),
}));

import { GET, POST } from "@/app/api/ai-assistant/route";

describe("GET /api/ai-assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(mockQueryBuilder);
  });

  it("should return 400 if patientId is missing", async () => {
    const request = new Request("http://localhost/api/ai-assistant");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Patient ID");
  });

  it("should fetch AI recommendations successfully", async () => {
    setMockResponses(
      { data: mockPatient, error: null },
      { data: mockMedications, error: null }
    );

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
    setMockResponses(
      { data: null, error: { code: "PGRST116", message: "No rows found" } },
      { data: [], error: null }
    );

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
    mockFrom.mockReturnValue(mockQueryBuilder);
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
    setMockResponses(
      { data: mockPatient, error: null },
      { data: mockMedications, error: null }
    );

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
    setMockResponses(
      { data: null, error: { code: "PGRST116", message: "No rows found" } },
      { data: [], error: null }
    );

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
