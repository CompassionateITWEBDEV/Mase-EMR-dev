import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useAIAssistant,
  useDrugInteractions,
  useRequestAIAnalysis,
} from "@/hooks/use-ai-assistant";
import { createTestQueryClient } from "../utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  mockAIRecommendations,
  mockDrugInteractions,
} from "../utils/mock-data";

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useAIAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch AI recommendations for patient", async () => {
    const mockResponse = {
      recommendations: mockAIRecommendations,
      generatedAt: new Date().toISOString(),
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(
      () => useAIAssistant({ patientId: "pat-1" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/ai-assistant?patientId=pat-1"
    );
  });

  it("should include context parameters in request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ recommendations: [] }),
    });

    const { result } = renderHook(
      () =>
        useAIAssistant({
          patientId: "pat-1",
          context: {
            encounterType: "follow_up",
            chiefComplaint: "Headache",
          },
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(fetchCall).toContain("patientId=pat-1");
    expect(fetchCall).toContain("encounterType=follow_up");
    expect(fetchCall).toContain("chiefComplaint=Headache");
  });

  it("should not fetch when patientId is empty", async () => {
    global.fetch = vi.fn();

    renderHook(() => useAIAssistant({ patientId: "" }), {
      wrapper: createWrapper(),
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should handle fetch error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "AI service unavailable" }),
    });

    const { result } = renderHook(
      () => useAIAssistant({ patientId: "pat-1" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("AI service unavailable");
  });
});

describe("useDrugInteractions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch drug interactions for patient", async () => {
    const mockResponse = {
      result: mockDrugInteractions[0],
      checkedAt: new Date().toISOString(),
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useDrugInteractions("pat-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/ai-assistant/drug-interactions?patientId=pat-1"
    );
  });

  it("should not fetch when patientId is null", async () => {
    global.fetch = vi.fn();

    renderHook(() => useDrugInteractions(null), {
      wrapper: createWrapper(),
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("useRequestAIAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should request AI analysis successfully", async () => {
    const mockResponse = {
      recommendations: mockAIRecommendations,
      generatedAt: new Date().toISOString(),
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useRequestAIAnalysis(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        patientId: "pat-1",
        encounterType: "new_patient",
        chiefComplaint: "Chest pain",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/ai-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: "pat-1",
        encounterType: "new_patient",
        chiefComplaint: "Chest pain",
      }),
    });
  });
});
