/**
 * Tests for Primary Care Dashboard Page
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
  usePathname: () => "/primary-care-dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the hooks
vi.mock("@/hooks/use-appointments", () => ({
  useAppointments: vi.fn(),
  useScheduleSummary: vi.fn(),
  useCreateAppointment: vi.fn(),
  useCancelAppointment: vi.fn(),
  useUpdateAppointment: vi.fn(),
}));

vi.mock("@/hooks/use-clinical-alerts", () => ({
  useClinicalAlerts: vi.fn(),
  useAcknowledgeAlert: vi.fn(),
}));

vi.mock("@/hooks/use-ai-assistant", () => ({
  useRequestAIAnalysis: vi.fn(),
}));

// Import mocked hooks
import { useAppointments, useScheduleSummary, useCreateAppointment, useCancelAppointment } from "@/hooks/use-appointments";
import { useClinicalAlerts, useAcknowledgeAlert } from "@/hooks/use-clinical-alerts";
import { useRequestAIAnalysis } from "@/hooks/use-ai-assistant";

// Import component after mocks
import PrimaryCareDashboardPage from "@/app/primary-care-dashboard/page";

// Mock data
const mockAppointments = {
  appointments: [
    {
      id: "apt-1",
      patient_id: "pat-1",
      appointment_date: new Date().toISOString(),
      appointment_type: "Follow-up",
      status: "scheduled",
      duration_minutes: 30,
      patients: { first_name: "John", last_name: "Smith" },
    },
    {
      id: "apt-2",
      patient_id: "pat-2",
      appointment_date: new Date().toISOString(),
      appointment_type: "New Patient",
      status: "checked_in",
      duration_minutes: 60,
      patients: { first_name: "Jane", last_name: "Doe" },
    },
  ],
  total: 2,
};

const mockAlerts = {
  alerts: [
    {
      patient: "John Smith",
      patientId: "pat-1",
      message: "Critical lab result",
      priority: "high",
      time: "5 min ago",
      type: "destructive",
      isAcknowledged: false,
    },
  ],
  total: 1,
};

const mockSummary = {
  summary: {
    total: 12,
    completed: 5,
    cancelled: 1,
    by_type: { "Follow-up": 8, "New Patient": 4 },
  },
};

// Wrapper component with QueryClient
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("PrimaryCareDashboardPage", () => {
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
    (useAppointments as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockAppointments,
      isLoading: false,
      error: null,
      isSuccess: true,
    });

    (useScheduleSummary as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockSummary,
      isLoading: false,
    });

    (useClinicalAlerts as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockAlerts,
      isLoading: false,
      error: null,
      isSuccess: true,
    });

    (useRequestAIAnalysis as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      data: null,
    });

    (useCreateAppointment as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
      reset: vi.fn(),
    });

    (useCancelAppointment as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
      reset: vi.fn(),
    });

    (useAcknowledgeAlert as ReturnType<typeof vi.fn>).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
      reset: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the dashboard with title", async () => {
    render(<PrimaryCareDashboardPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(screen.getByText(/Primary Care Dashboard/i)).toBeInTheDocument();
    });
  });

  it("should display loading state for appointments", async () => {
    (useAppointments as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
    });

    render(<PrimaryCareDashboardPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(screen.getByText("Loading schedule...")).toBeInTheDocument();
    });
  });

  it("should display appointments when loaded", async () => {
    render(<PrimaryCareDashboardPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      // Use getAllByText since patient names may appear multiple times
      const johnSmithElements = screen.getAllByText("John Smith");
      expect(johnSmithElements.length).toBeGreaterThan(0);
      const janeDoeElements = screen.getAllByText("Jane Doe");
      expect(janeDoeElements.length).toBeGreaterThan(0);
    });
  });

  it("should display error state when appointments fail to load", async () => {
    (useAppointments as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to fetch"),
      isSuccess: false,
    });

    render(<PrimaryCareDashboardPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load schedule/i)).toBeInTheDocument();
    });
  });

  it("should display empty state when no appointments", async () => {
    (useAppointments as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { appointments: [], total: 0 },
      isLoading: false,
      error: null,
      isSuccess: true,
    });

    render(<PrimaryCareDashboardPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(
        screen.getByText(/No appointments scheduled for today/i)
      ).toBeInTheDocument();
    });
  });

  it("should display clinical alerts", async () => {
    render(<PrimaryCareDashboardPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(screen.getByText(/Critical lab result/i)).toBeInTheDocument();
    });
  });

  it("should display loading state for clinical alerts", async () => {
    (useClinicalAlerts as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isSuccess: false,
    });

    render(<PrimaryCareDashboardPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      expect(screen.getByText("Loading alerts...")).toBeInTheDocument();
    });
  });

  it("should display stats from schedule summary", async () => {
    render(<PrimaryCareDashboardPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    await waitFor(() => {
      // The summary total should be displayed somewhere
      // Use getAllByText since "12" might appear in multiple places (e.g., in badges and stat cards)
      const allTwelves = screen.getAllByText("12");
      expect(allTwelves.length).toBeGreaterThan(0);

      // Verify at least one "12" is in the stat display (text-2xl font-bold)
      const statDisplay = allTwelves.find((el) => {
        const className = el.className || "";
        return (
          className.includes("text-2xl") && className.includes("font-bold")
        );
      });
      expect(statDisplay).toBeInTheDocument();
    });
  });

  it("should call useAppointments with today's date filter", async () => {
    render(<PrimaryCareDashboardPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    expect(useAppointments).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          date: expect.any(String),
        }),
        enabled: true,
      })
    );
  });

  it("should call useClinicalAlerts with unacknowledged filter", async () => {
    render(<PrimaryCareDashboardPage />, { wrapper: TestWrapper });

    // Wait for DashboardHeader async operations to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/notifications");
    });

    expect(useClinicalAlerts).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          acknowledged: false,
          limit: 10,
        }),
      })
    );
  });
});
