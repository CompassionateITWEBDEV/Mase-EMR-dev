/**
 * Utility function to fetch all providers from the database
 * Used primarily for dropdown/select components
 */

import type { Provider } from "@/types/patient";

export interface FetchAllProvidersOptions {
  specialty?: string;
  active?: boolean;
}

/**
 * Fetches all providers from the database via the API endpoint
 * @param options - Optional configuration for fetching providers
 * @returns Promise<Provider[]> - Array of provider objects
 */
export async function fetchAllProviders(
  options: FetchAllProvidersOptions = {}
): Promise<Provider[]> {
  const { specialty, active = true } = options;

  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Set active filter - always include it explicitly
    // When active is false, this will fetch all providers (both active and inactive)
    params.append("active", active.toString());
    
    // Add specialty filter if provided
    if (specialty) {
      params.append("specialty", specialty);
    }

    const url = `/api/providers?${params.toString()}`;
    console.log("[fetchAllProviders] Fetching providers from:", url, { active, specialty });

    // Fetch from the API endpoint
    const response = await fetch(url, {
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[fetchAllProviders] API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || "Unknown error",
      });
      
      // Return empty array on error to prevent UI crashes
      return [];
    }

    const data = await response.json();
    console.log("[fetchAllProviders] API response:", {
      status: response.status,
      dataKeys: Object.keys(data),
      providersCount: data.providers?.length || 0,
      rawData: data,
    });
    
    const providers: Provider[] = data.providers || [];

    // Sort by last name, then first name for better UX in dropdowns
    const sortedProviders = providers.sort((a, b) => {
      const lastNameCompare = (a.last_name || "").localeCompare(
        b.last_name || ""
      );
      if (lastNameCompare !== 0) return lastNameCompare;
      return (a.first_name || "").localeCompare(b.first_name || "");
    });

    console.log(
      `[fetchAllProviders] Fetched ${sortedProviders.length} providers`,
      {
        specialty,
        active,
        totalFromAPI: providers.length,
        providers: sortedProviders.map(p => `${p.first_name} ${p.last_name}`),
      }
    );

    return sortedProviders;
  } catch (error) {
    console.error("[fetchAllProviders] Network or parsing error:", error);
    
    // Return empty array on error to prevent UI crashes
    return [];
  }
}
