import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockQueryBuilder, mockFrom } = vi.hoisted(() => {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["select", "insert", "update", "delete", "order", "eq", "single"];
  methods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });
  builder.single.mockResolvedValue({ data: null, error: null });
  return { mockQueryBuilder: builder, mockFrom: vi.fn().mockReturnValue(builder) };
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

import { GET, PUT, DELETE } from "@/app/api/appointments/[id]/route";

describe("GET /api/appointments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockQueryBuilder).forEach((fn) => fn.mockReturnValue(mockQueryBuilder));
    mockFrom.mockReturnValue(mockQueryBuilder);
  });

  it("should fetch appointment by ID", async () => {
    const mockAppointment = { id: "apt-1", patient_id: "p1", status: "scheduled" };
    mockQueryBuilder.single.mockResolvedValue({ data: mockAppointment, error: null });

    const request = new Request("http://localhost/api/appointments/apt-1");
    const response = await GET(request, { params: Promise.resolve({ id: "apt-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.appointment).toEqual(mockAppointment);
  });

  it("should return 404 if appointment not found", async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: { code: "PGRST116", message: "Not found" } });

    const request = new Request("http://localhost/api/appointments/invalid");
    const response = await GET(request, { params: Promise.resolve({ id: "invalid" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Appointment not found");
  });
});

describe("PUT /api/appointments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockQueryBuilder).forEach((fn) => fn.mockReturnValue(mockQueryBuilder));
    mockFrom.mockReturnValue(mockQueryBuilder);
  });

  it("should update appointment successfully", async () => {
    const updatedAppointment = { id: "apt-1", status: "completed", notes: "Visit completed" };
    mockQueryBuilder.single.mockResolvedValue({ data: updatedAppointment, error: null });

    const request = new Request("http://localhost/api/appointments/apt-1", {
      method: "PUT",
      body: JSON.stringify({ status: "completed", notes: "Visit completed" }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: "apt-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.appointment.status).toBe("completed");
  });

  it("should return 404 if appointment not found", async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: { code: "PGRST116", message: "Not found" } });

    const request = new Request("http://localhost/api/appointments/invalid", {
      method: "PUT",
      body: JSON.stringify({ status: "completed" }),
    });

    const response = await PUT(request, { params: Promise.resolve({ id: "invalid" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Appointment not found");
  });
});

describe("DELETE /api/appointments/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockQueryBuilder).forEach((fn) => fn.mockReturnValue(mockQueryBuilder));
    mockFrom.mockReturnValue(mockQueryBuilder);
  });

  it("should cancel appointment (soft delete)", async () => {
    const cancelledAppointment = { id: "apt-1", status: "cancelled" };
    mockQueryBuilder.single.mockResolvedValue({ data: cancelledAppointment, error: null });

    const request = new Request("http://localhost/api/appointments/apt-1", { method: "DELETE" });
    const response = await DELETE(request, { params: Promise.resolve({ id: "apt-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe("Appointment cancelled");
    expect(data.appointment.status).toBe("cancelled");
  });

  it("should return 404 if appointment not found", async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: { code: "PGRST116", message: "Not found" } });

    const request = new Request("http://localhost/api/appointments/invalid", { method: "DELETE" });
    const response = await DELETE(request, { params: Promise.resolve({ id: "invalid" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Appointment not found");
  });
});

