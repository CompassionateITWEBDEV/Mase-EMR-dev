import { vi } from "vitest";

/**
 * Mock Supabase client for testing
 */
export interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
  };
}

/**
 * Creates a chainable query builder mock
 */
export function createMockQueryBuilder<T>(data: T, error: Error | null = null) {
  const mockBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: (value: { data: T; error: Error | null }) => void) => {
      resolve({ data, error });
      return Promise.resolve({ data, error });
    },
  };

  // Make it thenable
  Object.defineProperty(mockBuilder, "then", {
    value: (
      onFulfilled: (value: { data: T; error: Error | null }) => void
    ) => {
      return Promise.resolve({ data, error }).then(onFulfilled);
    },
  });

  return mockBuilder;
}

/**
 * Creates a complete mock Supabase client
 */
export function createMockSupabaseClient<T>(
  data: T,
  error: Error | null = null
): MockSupabaseClient {
  const queryBuilder = createMockQueryBuilder(data, error);

  return {
    from: vi.fn().mockReturnValue(queryBuilder),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@test.com" } },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      }),
    },
  };
}

/**
 * Setup mock for @/lib/supabase/server module
 */
export function setupSupabaseMock<T>(data: T, error: Error | null = null) {
  const mockClient = createMockSupabaseClient(data, error);

  vi.mock("@/lib/supabase/server", () => ({
    createServerClient: vi.fn().mockResolvedValue(mockClient),
  }));

  return mockClient;
}

/**
 * Reset all Supabase mocks
 */
export function resetSupabaseMocks() {
  vi.clearAllMocks();
}

