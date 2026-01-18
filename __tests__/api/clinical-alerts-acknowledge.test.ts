import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockQueryBuilder, mockFrom, mockGetUser } = vi.hoisted(() => {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ["select", "insert", "update", "delete", "order", "eq", "single"];
  methods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });
  builder.single.mockResolvedValue({ data: null, error: null });
  return {
    mockQueryBuilder: builder,
    mockFrom: vi.fn().mockReturnValue(builder),
    mockGetUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "test@test.com" } } }),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock("@/lib/auth/middleware", () => ({
  getAuthenticatedUser: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", email: "test@example.com" },
    error: null,
  }),
}));

import { POST } from "@/app/api/clinical-alerts/[id]/acknowledge/route";

describe("POST /api/clinical-alerts/[id]/acknowledge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.values(mockQueryBuilder).forEach((fn) => fn.mockReturnValue(mockQueryBuilder));
    mockFrom.mockReturnValue(mockQueryBuilder);
  });

  it("should acknowledge alert successfully", async () => {
    const acknowledgedAlert = { id: "alert-1", status: "acknowledged", acknowledged_by: "user-1" };
    mockQueryBuilder.single.mockResolvedValue({ data: acknowledgedAlert, error: null });

    const request = new Request("http://localhost/api/clinical-alerts/alert-1/acknowledge", { method: "POST" });
    const response = await POST(request, { params: Promise.resolve({ id: "alert-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Alert acknowledged successfully");
    expect(data.alert.status).toBe("acknowledged");
  });

  it("should return 404 if alert not found", async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: { code: "PGRST116", message: "Not found" } });

    const request = new Request("http://localhost/api/clinical-alerts/invalid/acknowledge", { method: "POST" });
    const response = await POST(request, { params: Promise.resolve({ id: "invalid" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Alert not found");
  });

  it("should handle database error", async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: { code: "OTHER", message: "Database error" } });

    const request = new Request("http://localhost/api/clinical-alerts/alert-1/acknowledge", { method: "POST" });
    const response = await POST(request, { params: Promise.resolve({ id: "alert-1" }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Database error");
  });
});

