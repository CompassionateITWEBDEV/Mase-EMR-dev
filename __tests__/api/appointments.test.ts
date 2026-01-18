import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to define mocks before they're used in vi.mock
const { mockQueryBuilder, mockFrom } = vi.hoisted(() => {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "order",
    "range",
    "eq",
    "gte",
    "lte",
    "in",
    "single",
  ];
  methods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });
  builder.range.mockResolvedValue({ data: [], error: null, count: 0 });
  builder.single.mockResolvedValue({ data: null, error: null });
  return {
    mockQueryBuilder: builder,
    mockFrom: vi.fn().mockReturnValue(builder),
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

import { GET, POST } from "@/app/api/appointments/route";

describe("GET /api/appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockQueryBuilder).forEach((fn) =>
      fn.mockReturnValue(mockQueryBuilder)
    );
    mockQueryBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue(mockQueryBuilder);
  });

  it("should fetch appointments successfully", async () => {
    const mockAppointments = [
      { id: "1", patient_id: "p1", status: "scheduled" },
      { id: "2", patient_id: "p2", status: "completed" },
    ];
    mockQueryBuilder.range.mockResolvedValue({
      data: mockAppointments,
      error: null,
      count: 2,
    });

    const request = new Request("http://localhost/api/appointments");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.appointments).toEqual(mockAppointments);
    expect(data.pagination).toEqual({ page: 1, pageSize: 50, total: 2 });
  });

  it("should return summary when requested", async () => {
    const mockAppointments = [
      { id: "1", status: "scheduled" },
      { id: "2", status: "completed" },
      { id: "3", status: "cancelled" },
    ];
    mockQueryBuilder.range.mockResolvedValue({
      data: mockAppointments,
      error: null,
      count: 3,
    });

    const request = new Request(
      "http://localhost/api/appointments?summary=true"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(data.summary).toBeDefined();
    expect(data.summary.total).toBe(3);
  });

  it("should handle database error", async () => {
    mockQueryBuilder.range.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
      count: 0,
    });

    const request = new Request("http://localhost/api/appointments");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Database error");
  });
});

describe("POST /api/appointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockQueryBuilder).forEach((fn) =>
      fn.mockReturnValue(mockQueryBuilder)
    );
    mockFrom.mockReturnValue(mockQueryBuilder);
  });

  it("should create appointment successfully", async () => {
    // Use a future date to pass validation
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const appointmentDate = futureDate.toISOString();

    const newAppointment = {
      id: "new-1",
      patient_id: "p1",
      appointment_date: appointmentDate,
    };

    // Mock patient lookup (first call) - returns patient
    // Mock appointment insert (second call) - returns new appointment
    let callCount = 0;
    mockQueryBuilder.single.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: patient lookup
        return Promise.resolve({ data: { id: "p1" }, error: null });
      } else {
        // Second call: appointment insert
        return Promise.resolve({ data: newAppointment, error: null });
      }
    });

    const request = new Request("http://localhost/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        patient_id: "p1",
        appointment_date: appointmentDate,
        appointment_type: "follow-up",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.appointment).toEqual(newAppointment);
  });

  it("should return 400 if patient_id is missing", async () => {
    const request = new Request("http://localhost/api/appointments", {
      method: "POST",
      body: JSON.stringify({ appointment_date: "2024-01-15" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Patient ID is required");
  });
});
