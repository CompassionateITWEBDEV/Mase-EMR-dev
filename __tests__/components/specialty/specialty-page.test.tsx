/**
 * Tests for Specialty Page
 * Tests the refactored component that uses React Query hooks
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, render } from "@testing-library/react";
import { createTestQueryClient } from "../../utils/test-utils";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/specialty/primary-care",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "primary-care" }),
}));

// Mock the hooks
vi.mock("@/hooks/use-specialty-config", () => ({
  useSpecialtyConfig: vi.fn(),
}));

vi.mock("@/hooks/use-quality-measures", () => ({
  useQualityMeasures: vi.fn(),
}));

// Import mocked hooks
import { useSpecialtyConfig } from "@/hooks/use-specialty-config";
import { useQualityMeasures } from "@/hooks/use-quality-measures";

// Import component after mocks
import SpecialtyPage from "@/app/specialty/[id]/page";

// Mock data
const mockSpecialtyConfig = {
  specialties: [
    {
      id: "spec-1",
      specialty_id: "primary-care",
      enabled: true,
      configured_at: new Date().toISOString(),
    },
  ],
  features: [
    {
      id: "feat-1",
      specialty_id: "primary-care",
      feature_code: "icd10",
      feature_name: "ICD-10 Diagnosis Coding",
      is_core_feature: true,
    },
    {
      id: "feat-2",
      specialty_id: "primary-care",
      feature_code: "vitals",
      feature_name: "Vitals Trending",
      is_core_feature: true,
    },
  ],
};

const mockQualityMeasures = {
  measures: [
    {
      id: "measure-1",
      measure_id: "CMS165",
      measure_name: "Controlling High Blood Pressure",
      specialty: "primary-care",
      numerator: 75,
      denominator: 100,
      performance_rate: 75,
      target_rate: 70,
      description: "Percentage of patients with controlled BP",
    },
  ],
  total: 1,
};

// Wrapper component with QueryClient
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("SpecialtyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch for DashboardHeader notifications
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === "/api/notifications") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ notifications: [] }),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch call to ${url}`));
    });

    // Default mock implementations
    (useSpecialtyConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockSpecialtyConfig,
      isLoading: false,
      error: null,
      isSuccess: true,
    });

    (useQualityMeasures as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockQualityMeasures,
      isLoading: false,
      error: null,
      isSuccess: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the specialty page with title", async () => {
    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(
        screen.getByText("Primary Care / Family Medicine")
      ).toBeInTheDocument();
    });
  });

  it("should display loading state", async () => {
    (useSpecialtyConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
    });

    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Loading specialty configuration/i)
      ).toBeInTheDocument();
    });
  });

  it("should display error state", async () => {
    (useSpecialtyConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load"),
      isSuccess: false,
    });

    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Specialty/i)).toBeInTheDocument();
    });
  });

  it("should display specialty features", async () => {
    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      // Check for feature names from API
      expect(screen.getByText("ICD-10 Diagnosis Coding")).toBeInTheDocument();
      expect(screen.getByText("Vitals Trending")).toBeInTheDocument();
    });
  });

  it("should display active specialty badge when enabled", async () => {
    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(screen.getByText("Active Specialty")).toBeInTheDocument();
    });
  });

  it("should display inactive badge when specialty is disabled", async () => {
    (useSpecialtyConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        specialties: [{ specialty_id: "primary-care", enabled: false }],
        features: [],
      },
      isLoading: false,
      error: null,
      isSuccess: true,
    });

    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(screen.getByText("Inactive Specialty")).toBeInTheDocument();
    });
  });

  it("should display quality measures tab", async () => {
    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      // Verify the Quality Measures tab exists
      const qualityTab = screen.getByRole("tab", { name: /Quality Measures/i });
      expect(qualityTab).toBeInTheDocument();
    });
  });

  it("should display quality measures badge when measures exist", async () => {
    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      // The badge shows "1 Quality Measures" based on mock data
      expect(screen.getByText("1 Quality Measures")).toBeInTheDocument();
    });
  });

  it("should call useSpecialtyConfig with specialty ID", async () => {
    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    expect(useSpecialtyConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        specialtyId: "primary-care",
      })
    );
  });

  it("should call useQualityMeasures with specialty filter", async () => {
    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    expect(useQualityMeasures).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          specialty: "primary-care",
        }),
      })
    );
  });

  it("should display features count badge", async () => {
    render(<SpecialtyPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(screen.getByText("2 Features")).toBeInTheDocument();
    });
  });
});
