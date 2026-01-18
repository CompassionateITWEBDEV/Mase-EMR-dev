import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Suppress Node.js localStorage file warnings from jsdom
const originalEmitWarning = process.emitWarning;
beforeAll(() => {
  // Use type assertion to handle multiple overloads of process.emitWarning
  process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
    if (
      typeof warning === "string" &&
      warning.includes("--localstorage-file")
    ) {
      return;
    }
    if (warning instanceof Error && warning.message.includes("--localstorage-file")) {
      return;
    }
    // Call original with proper type assertion - args can match any overload signature
    return originalEmitWarning.call(process, warning, ...(args as Parameters<typeof originalEmitWarning> extends [unknown, ...infer Rest] ? Rest : never[]));
  }) as typeof process.emitWarning;
});

afterAll(() => {
  process.emitWarning = originalEmitWarning;
});

// Helper function to set up default fetch mock
function setupDefaultFetchMock() {
  global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
    const urlString = typeof url === "string" ? url : url.toString();
    
    // Default mock for notifications endpoint (used by DashboardHeader)
    if (urlString.includes("/api/notifications")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ notifications: [] }),
      });
    }
    
    // For other endpoints, return a rejected promise to catch unmocked calls
    return Promise.reject(
      new Error(`Unmocked fetch call to ${urlString}. Please mock this endpoint in your test.`)
    );
  });
}

// Cleanup after each test
afterEach(() => {
  cleanup();
  // Reset fetch mock to default implementation after each test
  vi.clearAllMocks();
  setupDefaultFetchMock();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useParams: () => ({}),
  usePathname: () => "",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock global fetch for API tests with default implementation
setupDefaultFetchMock();

// Suppress console errors and warnings during tests (optional)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  const shouldSuppress = (message: string): boolean => {
    // Suppress React warnings already handled
    if (message.includes("Warning: ReactDOM.render is no longer supported")) {
      return true;
    }
    
    // Suppress expected API error/warning patterns from intentional error scenario tests
    if (
      message.includes("Database error") ||
      message.includes("No rows found") ||
      message.includes("[API]") ||
      message.includes("[v0]") ||
      message.includes("Error fetching") ||
      message.includes("Error creating") ||
      message.includes("Error updating") ||
      message.includes("Error deleting") ||
      message.includes("Failed to fetch") ||
      message.includes("Failed to load") ||
      message.includes("table not found") ||
      message.includes("clinical_alerts")
    ) {
      return true;
    }
    
    return false;
  };

  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === "string" ? args[0] : String(args[0]);
    if (!shouldSuppress(message)) {
      originalError.call(console, ...args);
    }
  };

  console.warn = (...args: unknown[]) => {
    const message = typeof args[0] === "string" ? args[0] : String(args[0]);
    if (!shouldSuppress(message)) {
      originalWarn.call(console, ...args);
    }
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

