import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  useSpecialtyConfig,
  useUpdateSpecialtyConfig,
} from "@/hooks/use-specialty-config";
import { createTestQueryClient } from "../utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  mockSpecialtyConfigurations,
  mockSpecialtyFeatures,
} from "../utils/mock-data";

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useSpecialtyConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch specialty configuration successfully", async () => {
    const mockResponse = {
      specialties: mockSpecialtyConfigurations,
      features: mockSpecialtyFeatures,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useSpecialtyConfig(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith("/api/specialty-config");
  });

  it("should apply specialty filter", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ specialties: [], features: [] }),
    });

    const { result } = renderHook(
      () => useSpecialtyConfig({ specialtyId: "primary-care" }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/specialty-config?specialty=primary-care"
    );
  });

  it("should not fetch when disabled", async () => {
    global.fetch = vi.fn();

    const { result } = renderHook(
      () => useSpecialtyConfig({ enabled: false }),
      {
        wrapper: createWrapper(),
      }
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should handle fetch error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Configuration not found" }),
    });

    const { result } = renderHook(() => useSpecialtyConfig(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Configuration not found");
  });
});

describe("useUpdateSpecialtyConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update specialty configuration successfully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useUpdateSpecialtyConfig(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        specialtyIds: ["primary-care", "behavioral-health"],
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/specialty-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        specialtyIds: ["primary-care", "behavioral-health"],
      }),
    });
  });

  it("should handle update error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Update failed" }),
    });

    const { result } = renderHook(() => useUpdateSpecialtyConfig(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ specialtyIds: [] });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
