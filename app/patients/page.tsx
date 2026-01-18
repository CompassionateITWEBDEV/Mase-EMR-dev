"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { PatientList } from "@/components/patient-list";
import { PatientStats } from "@/components/patient-stats";
import { AddPatientDialog } from "@/components/add-patient-dialog";
import { Button } from "@/components/ui/button";
import {
  Filter,
  Plus,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Patient } from "@/types/patient";

const DEFAULT_PROVIDER = {
  id: "00000000-0000-0000-0000-000000000001",
  first_name: "Demo",
  last_name: "Provider",
  email: "demo@example.com",
  role: "physician",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    highRisk: 0,
    recentAppointments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      // Get provider info and session token for auth context
      let sessionToken: string | null = null;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Get session separately (getUser doesn't return session)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (user && session) {
          sessionToken = session.access_token;
          const { data: providerData } = await supabase
            .from("providers")
            .select("*")
            .eq("id", user.id)
            .single();
          if (providerData) {
            setProvider(providerData);
          }
        }
      } catch (authError) {
        console.log("[v0] Auth check failed, using default provider");
      }

      // Fetch patients and stats from API route
      console.log("[v0] Fetching patients from /api/patients/list");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Include authorization header if we have a session token
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }

      const response = await fetch("/api/patients/list", {
        credentials: "include",
        headers,
      });

      console.log(
        "[v0] API response status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[v0] API error response:", errorData);
        throw new Error(
          errorData.error ||
            `Failed to fetch patients: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("[v0] API response data:", {
        patientsCount: data.patients?.length || 0,
        stats: data.stats,
        hasError: !!data.error,
      });

      if (data.error) {
        console.error("[v0] API returned error:", data.error);
        throw new Error(data.error);
      }

      const patientsData = data.patients || [];
      const statsData = data.stats || {
        total: 0,
        active: 0,
        highRisk: 0,
        recentAppointments: 0,
      };

      console.log("[v0] Processed patients:", patientsData.length);
      console.log(
        "[v0] First patient sample:",
        patientsData[0]
          ? {
              id: patientsData[0].id,
              name: `${patientsData[0].first_name} ${patientsData[0].last_name}`,
            }
          : "No patients"
      );

      setPatients(patientsData);
      setStats(statsData);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load patients. Please try again.";
      console.error("[v0] Error fetching patients:", errorMessage);
      setError(errorMessage);
      setPatients([]);
      setStats({ total: 0, active: 0, highRisk: 0, recentAppointments: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handlePatientAdded = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <DashboardHeader />
          <main className="p-6">
            <div className="text-center py-12">Loading patients...</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                Patient Management
              </h1>
              <p className="text-muted-foreground">
                Comprehensive patient database and records
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <AddPatientDialog
                providerId={provider.id}
                onSuccess={handlePatientAdded}>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Patient
                </Button>
              </AddPatientDialog>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Patients</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchData}
                  className="ml-4">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <PatientStats stats={stats} />

          <PatientList
            patients={patients}
            currentProviderId={provider.id}
            showFilters={showFilters}
            onPatientUpdated={fetchData}
            onPatientDeleted={fetchData}
          />
        </main>
      </div>
    </div>
  );
}
