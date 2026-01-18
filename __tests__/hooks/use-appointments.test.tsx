import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAppointments, useAppointment, useScheduleSummary } from "@/hooks/use-appointments";
import { createTestQueryClient } from "../utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { mockScheduleItems } from "../utils/mock-data";

// Create wrapper with QueryClient
function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useAppointments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch appointments successfully", async () => {
    const mockResponse = { appointments: mockScheduleItems, total: 3 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useAppointments(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith("/api/appointments");
  });

  it("should apply date filter to query", async () => {
    const mockResponse = { appointments: [mockScheduleItems[0]], total: 1 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(
      () => useAppointments({ filters: { date: "2024-01-15" } }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/appointments?date=2024-01-15");
  });

  it("should apply multiple filters", async () => {
    const mockResponse = { appointments: [], total: 0 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(
      () =>
        useAppointments({
          filters: {
            date: "2024-01-15",
            providerId: "prov-1",
            status: ["scheduled", "confirmed"],
          },
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(fetchCall).toContain("date=2024-01-15");
    expect(fetchCall).toContain("providerId=prov-1");
    expect(fetchCall).toContain("status=scheduled%2Cconfirmed");
  });

  it("should handle fetch error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    const { result } = renderHook(() => useAppointments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Server error");
  });

  it("should not fetch when disabled", async () => {
    global.fetch = vi.fn();

    const { result } = renderHook(() => useAppointments({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("useAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch single appointment by ID", async () => {
    const mockAppointment = { appointment: mockScheduleItems[0] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockAppointment),
    });

    const { result } = renderHook(() => useAppointment("apt-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockAppointment);
    expect(global.fetch).toHaveBeenCalledWith("/api/appointments/apt-1");
  });

  it("should not fetch when appointmentId is null", async () => {
    global.fetch = vi.fn();

    renderHook(() => useAppointment(null), {
      wrapper: createWrapper(),
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("useScheduleSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch schedule summary", async () => {
    const mockSummary = {
      summary: {
        totalAppointments: 10,
        completed: 5,
        scheduled: 3,
        cancelled: 2,
      },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSummary),
    });

    const { result } = renderHook(() => useScheduleSummary("2024-01-15"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSummary);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/appointments?date=2024-01-15&summary=true"
    );
  });
});

