"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

interface AuthToggleState {
  bypassAuth: boolean;
  disableTokenRefresh: boolean;
}

interface AuthToggleContextValue extends AuthToggleState {
  setBypassAuth: (value: boolean) => void;
  setDisableTokenRefresh: (value: boolean) => void;
  isDevMode: boolean;
}

const STORAGE_KEY = "dev_auth_toggle_state";
const BYPASS_AUTH_KEY = "dev_bypass_auth";
const DISABLE_REFRESH_KEY = "dev_disable_token_refresh";

const AuthToggleContext = createContext<AuthToggleContextValue | undefined>(
  undefined
);

function isDevelopmentMode(): boolean {
  if (typeof window === "undefined") {
    return (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true"
    );
  }
  return (
    process.env.NODE_ENV === "development" &&
    (process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true" ||
      window.localStorage.getItem("dev_tools_enabled") === "true")
  );
}

function getStoredState(): AuthToggleState {
  if (typeof window === "undefined") {
    return { bypassAuth: false, disableTokenRefresh: false };
  }
  try {
    const stored =
      localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthToggleState;
      return parsed;
    }
    const bypassAuth = localStorage.getItem(BYPASS_AUTH_KEY) === "true";
    const disableRefresh = localStorage.getItem(DISABLE_REFRESH_KEY) === "true";
    return { bypassAuth, disableTokenRefresh: disableRefresh };
  } catch (error) {
    console.warn("[DevTools] Error reading stored toggle state:", error);
    return { bypassAuth: false, disableTokenRefresh: false };
  }
}

function saveState(state: AuthToggleState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(BYPASS_AUTH_KEY, String(state.bypassAuth));
    localStorage.setItem(
      DISABLE_REFRESH_KEY,
      String(state.disableTokenRefresh)
    );
  } catch (error) {
    console.warn("[DevTools] Error saving toggle state:", error);
  }
}

interface AuthToggleProviderProps {
  children: React.ReactNode;
}

export function AuthToggleProvider({ children }: AuthToggleProviderProps) {
  const isDevMode = isDevelopmentMode();
  const [state, setState] = useState<AuthToggleState>({
    bypassAuth: false,
    disableTokenRefresh: false,
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (isDevMode) {
      setState(getStoredState());
    }
  }, [isDevMode]);

  // Save state to storage whenever it changes
  const saveStateCallback = useCallback((newState: AuthToggleState) => {
    saveState(newState);
  }, []);

  // Update cookies when state changes (for server-side access)
  useEffect(() => {
    if (!isClient || typeof document === "undefined") return;

    if (state.bypassAuth) {
      document.cookie = `dev_bypass_auth=true; path=/; max-age=86400; SameSite=Lax`;
    } else {
      document.cookie = `dev_bypass_auth=; path=/; max-age=0; SameSite=Lax`;
    }

    if (state.disableTokenRefresh) {
      document.cookie = `dev_disable_token_refresh=true; path=/; max-age=86400; SameSite=Lax`;
    } else {
      document.cookie = `dev_disable_token_refresh=; path=/; max-age=0; SameSite=Lax`;
    }
  }, [state, isClient]);

  // Warn in console when toggles are active
  useEffect(() => {
    if (!isClient || !isDevMode) return;

    if (state.bypassAuth) {
      console.warn(
        "[DevTools] ⚠️ Auth bypass is ACTIVE - authentication checks are disabled"
      );
    }
    if (state.disableTokenRefresh) {
      console.warn(
        "[DevTools] ⚠️ Token refresh is DISABLED - tokens will not auto-refresh"
      );
    }
  }, [state, isClient, isDevMode]);

  // Listen for storage changes (e.g., from other tabs)
  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEY ||
        e.key === BYPASS_AUTH_KEY ||
        e.key === DISABLE_REFRESH_KEY
      ) {
        setState(getStoredState());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isClient]);

  const setBypassAuth = useCallback(
    (value: boolean) => {
      if (!isDevMode) {
        console.warn(
          "[DevTools] Cannot modify toggles outside development mode"
        );
        return;
      }
      const newState = { ...state, bypassAuth: value };
      setState(newState);
      saveStateCallback(newState);

      if (typeof document !== "undefined") {
        if (value) {
          document.cookie = `dev_bypass_auth=true; path=/; max-age=86400; SameSite=Lax`;
        } else {
          document.cookie = `dev_bypass_auth=; path=/; max-age=0; SameSite=Lax`;
        }
      }
    },
    [isDevMode, state, saveStateCallback]
  );

  const setDisableTokenRefresh = useCallback(
    (value: boolean) => {
      if (!isDevMode) {
        console.warn(
          "[DevTools] Cannot modify toggles outside development mode"
        );
        return;
      }
      const newState = { ...state, disableTokenRefresh: value };
      setState(newState);
      saveStateCallback(newState);

      if (typeof document !== "undefined") {
        if (value) {
          document.cookie = `dev_disable_token_refresh=true; path=/; max-age=86400; SameSite=Lax`;
        } else {
          document.cookie = `dev_disable_token_refresh=; path=/; max-age=0; SameSite=Lax`;
        }
      }
    },
    [isDevMode, state, saveStateCallback]
  );

  const contextValue = useMemo(
    () => ({
      ...state,
      setBypassAuth,
      setDisableTokenRefresh,
      isDevMode: isDevMode && isClient, // Only expose isDevMode as true on client after mount
    }),
    [state, setBypassAuth, setDisableTokenRefresh, isDevMode, isClient]
  );

  return (
    <AuthToggleContext.Provider value={contextValue}>
      {children}
    </AuthToggleContext.Provider>
  );
}

export function useAuthToggle(): AuthToggleContextValue {
  const context = useContext(AuthToggleContext);
  if (context === undefined) {
    throw new Error("useAuthToggle must be used within an AuthToggleProvider");
  }
  return context;
}

/**
 * Check if token refresh should be disabled (for use outside React components)
 * @returns true if token refresh should be disabled
 */
export function shouldDisableTokenRefresh(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    // Check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AuthToggleState;
      return parsed.disableTokenRefresh === true;
    }
    // Fallback to individual key
    return localStorage.getItem(DISABLE_REFRESH_KEY) === "true";
  } catch {
    return false;
  }
}
