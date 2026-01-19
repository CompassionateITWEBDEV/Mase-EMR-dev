import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useQualityMeasures,
  useRecordQualityMeasure,
} from "@/hooks/use-quality-measures";
import { createTestQueryClient } from "../utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockQualityMeasures = [
  {
    id: "qm-1",
    measure_id: "PREV-001",
    measure_name: "Preventive Care Screening",
    description: "Annual wellness visit completion",
    specialty: "primary-care",
    category: "preventive",
    target_rate: 80,
    denominator: 100,
    numerator: 75,
    performance_rate: 75,
    data_completeness: 95,
    meets_minimum: true,
    meets_data_completeness: true,
  },
  {
    id: "qm-2",
    measure_id: "DIAB-001",
    measure_name: "Diabetes Management",
    description: "HbA1c control",
    specialty: "primary-care",
    category: "chronic",
    target_rate: 70,
    denominator: 50,
    numerator: 40,
    performance_rate: 80,
    data_completeness: 90,
    meets_minimum: true,
    meets_data_completeness: true,
  },
];

describe("useQualityMeasures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch quality measures successfully", async () => {
    const mockResponse = {
      measures: mockQualityMeasures,
      year: "2024",
      specialty: null,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useQualityMeasures(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith("/api/quality-measures");
  });

  it("should apply specialty and year filters", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          measures: [],
          year: "2024",
          specialty: "primary-care",
        }),
    });

    const { result } = renderHook(
      () =>
        useQualityMeasures({
          filters: { specialty: "primary-care", year: "2024" },
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(fetchCall).toContain("specialty=primary-care");
    expect(fetchCall).toContain("year=2024");
  });

  it("should handle fetch error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Database error" }),
    });

    const { result } = renderHook(() => useQualityMeasures(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Database error");
  });

  it("should not fetch when disabled", async () => {
    global.fetch = vi.fn();

    const { result } = renderHook(
      () => useQualityMeasures({ enabled: false }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("useRecordQualityMeasure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should record quality measure successfully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: "tracking-1" } }),
    });

    const { result } = renderHook(() => useRecordQualityMeasure(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        measure_id: "qm-1",
        patient_id: "pat-1",
        in_numerator: true,
        in_denominator: true,
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/quality-measures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        measure_id: "qm-1",
        patient_id: "pat-1",
        in_numerator: true,
        in_denominator: true,
      }),
    });
  });
});
