import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useClinicalAlerts,
  useUnacknowledgedAlerts,
  useAcknowledgeAlert,
} from "@/hooks/use-clinical-alerts";
import { createTestQueryClient } from "../utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { mockClinicalAlerts } from "../utils/mock-data";

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useClinicalAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch clinical alerts successfully", async () => {
    const mockResponse = { alerts: mockClinicalAlerts, total: 3 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useClinicalAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith("/api/clinical-alerts");
  });

  it("should apply patientId filter", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ alerts: [], total: 0 }),
    });

    const { result } = renderHook(
      () => useClinicalAlerts({ filters: { patientId: "pat-1" } }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/clinical-alerts?patientId=pat-1"
    );
  });

  it("should apply priority and acknowledged filters", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ alerts: [], total: 0 }),
    });

    const { result } = renderHook(
      () =>
        useClinicalAlerts({
          filters: { priority: "high", acknowledged: false },
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(fetchCall).toContain("priority=high");
    expect(fetchCall).toContain("acknowledged=false");
  });

  it("should handle fetch error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Database error" }),
    });

    const { result } = renderHook(() => useClinicalAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Database error");
  });
});

describe("useUnacknowledgedAlerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch unacknowledged alerts", async () => {
    const unacknowledged = mockClinicalAlerts.filter((a) => !a.isAcknowledged);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ alerts: unacknowledged, total: 2 }),
    });

    const { result } = renderHook(() => useUnacknowledgedAlerts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/clinical-alerts?acknowledged=false"
    );
  });
});

describe("useAcknowledgeAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should acknowledge alert successfully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useAcknowledgeAlert(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate("alert-1");
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/clinical-alerts/alert-1/acknowledge",
      { method: "POST" }
    );
  });

  it("should handle acknowledge error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Alert not found" }),
    });

    const { result } = renderHook(() => useAcknowledgeAlert(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate("invalid-alert");
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
