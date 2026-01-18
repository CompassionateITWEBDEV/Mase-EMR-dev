import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockQueryBuilder, mockFrom, setMockData } = vi.hoisted(() => {
  let mockData: { data: unknown[] | null; error: unknown } = {
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
    "in",
    "single",
    "limit",
  ];
  methods.forEach((method) => {
    builder[method] = vi.fn().mockImplementation(() => builder);
  });

  // Make eq chainable and return the mock data on the last call
  builder.eq.mockImplementation(() => {
    // Return a thenable that also has chainable methods
    const chainable = {
      ...builder,
      then: (resolve: (value: unknown) => void) => resolve(mockData),
    };
    return chainable;
  });

  builder.in.mockImplementation(() => {
    const chainable = {
      ...builder,
      then: (resolve: (value: unknown) => void) => resolve(mockData),
    };
    return chainable;
  });

  return {
    mockQueryBuilder: builder,
    mockFrom: vi.fn().mockReturnValue(builder),
    setMockData: (data: { data: unknown[] | null; error: unknown }) => {
      mockData = data;
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}));

import { GET } from "@/app/api/ai-assistant/drug-interactions/route";

describe("GET /api/ai-assistant/drug-interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data to empty
    setMockData({ data: [], error: null });
    mockFrom.mockReturnValue(mockQueryBuilder);
  });

  it("should return 400 if no patientId or medicationIds provided", async () => {
    const request = new Request(
      "http://localhost/api/ai-assistant/drug-interactions"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Either patientId or medicationIds is required");
  });

  it("should check drug interactions for patient medications", async () => {
    const mockMedications = [
      { id: "m1", medication_name: "Warfarin" },
      { id: "m2", medication_name: "Aspirin" },
    ];
    setMockData({ data: mockMedications, error: null });

    const request = new Request(
      "http://localhost/api/ai-assistant/drug-interactions?patientId=p1"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("major");
    expect(data.interactions).toBeDefined();
    expect(data.interactions.length).toBeGreaterThan(0);
  });

  it("should return no interactions for single medication", async () => {
    const mockMedications = [{ id: "m1", medication_name: "Lisinopril" }];
    setMockData({ data: mockMedications, error: null });

    const request = new Request(
      "http://localhost/api/ai-assistant/drug-interactions?patientId=p1"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("no_major");
    expect(data.message).toContain("less than 2 medications");
  });

  it("should check interactions by medication IDs", async () => {
    const mockMedications = [
      { id: "m1", medication_name: "Metformin" },
      { id: "m2", medication_name: "Lisinopril" },
    ];
    setMockData({ data: mockMedications, error: null });

    const request = new Request(
      "http://localhost/api/ai-assistant/drug-interactions?medicationIds=m1,m2"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("no_major");
  });

  it("should handle database error", async () => {
    setMockData({ data: null, error: { message: "Database error" } });

    const request = new Request(
      "http://localhost/api/ai-assistant/drug-interactions?patientId=p1"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch medications");
  });
});
