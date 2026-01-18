
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Patient, Provider } from "@/types/patient"
import type { AppointmentStatus } from "@/types/schedule"
import { fetchAllPatients } from "@/lib/utils/fetch-patients"
import { useProviders } from "@/hooks/use-providers"
import { useCreateAppointment } from "@/hooks/use-appointments"
import { Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { providerKeys } from "@/lib/utils/query-keys"

interface CreateAppointmentDialogProps {
  children: React.ReactNode
  patients?: Patient[]
  providers?: Provider[]
  currentProviderId?: string
}

export function CreateAppointmentDialog({
  children,
  patients: initialPatients,
  providers: initialProviders,
  currentProviderId,
}: CreateAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>(initialPatients || [])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [patientsError, setPatientsError] = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // Use the appointment creation hook for proper authentication
  const createAppointment = useCreateAppointment()

  // Fetch providers using the hook (enabled when dialog is open)
  // Fetch ALL providers (both active and inactive) for appointment scheduling
  const {
    data: providersData,
    isLoading: providersLoading,
    error: providersError,
    refetch: refetchProviders,
  } = useProviders({
    active: false, // Fetch all providers, not just active ones
    enabled: open, // Only fetch when dialog is open
  })

  const providers = providersData?.providers || initialProviders || []

  // Invalidate and refetch providers when dialog opens
  useEffect(() => {
    if (open) {
      console.log("[CreateAppointmentDialog] Dialog opened, invalidating providers cache...")
      // Invalidate the cache to force a fresh fetch
      queryClient.invalidateQueries({
        queryKey: providerKeys.list({ active: false }),
      })
      // Also trigger a refetch
      refetchProviders()
    }
  }, [open, queryClient, refetchProviders])

  // Debug logging for providers
  useEffect(() => {
    if (open) {
      console.log("[CreateAppointmentDialog] Providers state:", {
        providersLoading,
        providersError: providersError?.message || providersError,
        providersData,
        providersCount: providers.length,
        providers,
        enabled: open,
      })
    }
  }, [open, providersLoading, providersError, providersData, providers])

  // Fetch patients when dialog opens
  useEffect(() => {
    if (open) {
      // If we have initial patients, use them, otherwise fetch
      if (initialPatients && initialPatients.length > 0) {
        setPatients(initialPatients)
      } else {
        setPatientsLoading(true)
        setPatientsError(null)
        fetchAllPatients()
          .then((fetchedPatients) => {
            setPatients(fetchedPatients)
            setPatientsError(null)
          })
          .catch((error) => {
            console.error("[CreateAppointmentDialog] Error fetching patients:", error)
            setPatientsError("Failed to load patients. Please try again.")
            setPatients([])
          })
          .finally(() => {
            setPatientsLoading(false)
          })
      }
    }
  }, [open, initialPatients])

  const [formData, setFormData] = useState({
    patientId: "",
    providerId: currentProviderId ?? "",
    appointmentDate: "",
    appointmentTime: "",
    durationMinutes: "50",
    appointmentType: "",
    mode: "in_person",
    status: "scheduled",
    notes: "",
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Update providerId when providers are loaded (only if currentProviderId is provided)
  useEffect(() => {
    if (open && providers.length > 0 && currentProviderId) {
      setFormData((prev) => {
        // Only set provider if currentProviderId is provided and matches a provider
        if (currentProviderId && providers.some((p) => p.id === currentProviderId)) {
          return { ...prev, providerId: currentProviderId }
        }
        return prev
      })
    }
  }, [open, providers, currentProviderId])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split("T")[0]
      setFormData({
        patientId: "",
        providerId: currentProviderId ?? "",
        appointmentDate: today,
        appointmentTime: "",
        durationMinutes: "50",
        appointmentType: "",
        mode: "in_person",
        status: "scheduled",
        notes: "",
      })
      setValidationErrors({})
    }
  }, [open, currentProviderId])

  const handleInputChange = (field: string, value: string) => {
    // Ensure value is always a string to prevent controlled/uncontrolled component warnings
    const stringValue = value ?? ""
    setFormData((prev) => ({ ...prev, [field]: stringValue }))
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.patientId) {
      errors.patientId = "Patient is required"
    }

    if (!formData.providerId) {
      errors.providerId = "Provider is required"
    }

    if (!formData.appointmentDate) {
      errors.appointmentDate = "Date is required"
    } else {
      // Validate date is not in the past
      const selectedDate = new Date(formData.appointmentDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        errors.appointmentDate = "Appointment date cannot be in the past"
      }
    }

    if (!formData.appointmentTime) {
      errors.appointmentTime = "Time is required"
    }

    if (!formData.appointmentType) {
      errors.appointmentType = "Appointment type is required"
    }

    if (!formData.durationMinutes) {
      errors.durationMinutes = "Duration is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    try {
      // Combine date and time into ISO string
      const appointmentDateTime = `${formData.appointmentDate}T${formData.appointmentTime}:00`

      // Use the mutation hook which handles authentication properly
      // Ensure status is properly typed as AppointmentStatus
      const statusValue: AppointmentStatus = (formData.status as AppointmentStatus) || "scheduled"
      
      await createAppointment.mutateAsync({
        patient_id: formData.patientId,
        provider_id: formData.providerId || undefined,
        appointment_date: appointmentDateTime,
        duration_minutes: Number.parseInt(formData.durationMinutes) || 60,
        appointment_type: formData.appointmentType,
        status: statusValue,
        notes: formData.notes || undefined,
      })

      toast.success("Appointment created successfully")
      setOpen(false)
      
      // Get the appointment date to determine which section it should appear in
      const appointmentDate = formData.appointmentDate
      
      // Navigate to the appointment date so the user can see their newly created appointment
      // This ensures it appears in the correct section (Today, Upcoming, or Past)
      if (appointmentDate) {
        // Navigate to the appointment date and refresh after a short delay
        // to ensure the navigation completes before refreshing server data
        router.push(`/appointments?date=${appointmentDate}`)
        setTimeout(() => {
          router.refresh()
        }, 100)
      } else {
        // If no date, just refresh the current page
        router.refresh()
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("Unknown error")
      console.error("Error creating appointment:", err)
      toast.error(err.message || "Failed to create appointment")
    }
  }

  const isFormValid =
    formData.patientId &&
    formData.providerId &&
    formData.appointmentDate &&
    formData.appointmentTime &&
    formData.appointmentType &&
    !patientsLoading &&
    !providersLoading &&
    !createAppointment.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule New Appointment</DialogTitle>
          <DialogDescription>Create a new appointment for a patient.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient *</Label>
              {patientsLoading ? (
                <div className="relative">
                  <Select disabled>
                    <SelectTrigger id="patient">
                      <SelectValue placeholder="Loading patients..." />
                    </SelectTrigger>
                  </Select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              ) : patientsError ? (
                <div className="space-y-1">
                  <Select disabled>
                    <SelectTrigger id="patient" className="border-destructive">
                      <SelectValue placeholder="Error loading patients" />
                    </SelectTrigger>
                  </Select>
                  <p className="text-xs text-destructive">{patientsError}</p>
                </div>
              ) : patients.length === 0 ? (
                <div className="space-y-1">
                  <Select disabled>
                    <SelectTrigger id="patient">
                      <SelectValue placeholder="No patients available" />
                    </SelectTrigger>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    No patients found. Please add a patient first.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Select
                    name="patientId"
                    value={formData.patientId ?? ""}
                    onValueChange={(value) => handleInputChange("patientId", value ?? "")}
                    required
                  >
                    <SelectTrigger
                      id="patient"
                      className={`${validationErrors.patientId ? "border-destructive" : ""} w-full overflow-hidden`}
                    >
                      <SelectValue placeholder="Select a patient" className="truncate" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[300px]">
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id} className="truncate">
                          {patient.first_name} {patient.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.patientId && (
                    <p className="text-xs text-destructive">{validationErrors.patientId}</p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              {providersLoading ? (
                <div className="relative">
                  <Select disabled>
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Loading providers..." />
                    </SelectTrigger>
                  </Select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              ) : providersError ? (
                <div className="space-y-1">
                  <Select disabled>
                    <SelectTrigger id="provider" className="border-destructive">
                      <SelectValue placeholder="Error loading providers" />
                    </SelectTrigger>
                  </Select>
                  <p className="text-xs text-destructive">
                    {providersError instanceof Error
                      ? providersError.message
                      : "Failed to load providers. Please check your connection."}
                  </p>
                </div>
              ) : providers.length === 0 ? (
                <div className="space-y-1">
                  <Select disabled>
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="No providers available" />
                    </SelectTrigger>
                  </Select>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        No providers found. To add providers:
                        <br />
                        1. Go to Staff Management
                        <br />
                        2. Add staff members with roles: Doctor, Counselor, Case Manager, Supervisor, RN, or Peer Recovery
                        <br />
                        3. Ensure they are marked as Active
                      </p>
                      {(providersError || providersData) && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <p className="font-semibold">Debug Info:</p>
                          {providersError && (
                            <p className="text-destructive">
                              Error: {
                                (providersError as Error | string | unknown) instanceof Error
                                  ? (providersError as Error).message
                                  : typeof providersError === "string"
                                    ? providersError
                                    : String(providersError)
                              }
                            </p>
                          )}
                          {providersData && (
                            <p>API returned: {providersData.providers?.length || 0} providers</p>
                          )}
                          <p>Loading: {providersLoading ? "Yes" : "No"}</p>
                          <p>Providers array length: {providers.length}</p>
                        </div>
                      )}
                      <a
                        href="/api/providers/debug"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        🔍 Check Staff Database (Debug)
                      </a>
                    </div>
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          console.log("[CreateAppointmentDialog] Manually fetching providers...")
                          try {
                            // Invalidate cache first
                            queryClient.invalidateQueries({
                              queryKey: providerKeys.list({ active: false }),
                            })
                            
                            // Then fetch directly
                            const response = await fetch("/api/providers?active=false", {
                              credentials: "include",
                            })
                            const data = await response.json()
                            console.log("[CreateAppointmentDialog] Manual fetch result:", data)
                            console.log("[CreateAppointmentDialog] Full API response:", JSON.stringify(data, null, 2))
                            console.log("[CreateAppointmentDialog] Providers count:", data.providers?.length || 0)
                            console.log("[CreateAppointmentDialog] Check server console for detailed API logs")
                            
                            if (data.providers && data.providers.length > 0) {
                              toast.success(`Found ${data.providers.length} provider(s) - refreshing...`)
                              // Force a refetch of the query
                              await refetchProviders()
                            } else {
                              const errorMsg = `No providers found (API returned ${data.providers?.length || 0}). Check browser console and server logs.`
                              console.error("[CreateAppointmentDialog]", errorMsg)
                              console.error("[CreateAppointmentDialog] Full response:", data)
                              toast.error(errorMsg)
                              // Still refetch to update the UI
                              await refetchProviders()
                            }
                          } catch (error) {
                            console.error("[CreateAppointmentDialog] Manual fetch error:", error)
                            toast.error("Failed to fetch providers. Check console for details.")
                          }
                        }}
                        className="w-full"
                      >
                        Refresh Providers & Check Logs
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log("[CreateAppointmentDialog] Current state:", {
                            providersLoading,
                            providersError,
                            providersData,
                            providersCount: providers.length,
                            providers,
                            queryKey: providerKeys.list({ active: false }),
                          })
                          toast.info("Check browser console for current state")
                        }}
                        className="w-full text-xs"
                      >
                        Show Current State (Console)
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Select
                    name="providerId"
                    value={formData.providerId ?? ""}
                    onValueChange={(value) => handleInputChange("providerId", value ?? "")}
                    required
                  >
                    <SelectTrigger
                      id="provider"
                      className={`${validationErrors.providerId ? "border-destructive" : ""} w-full overflow-hidden`}
                    >
                      <SelectValue placeholder="Select a provider" className="truncate" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[300px]">
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id} className="truncate">
                          {provider.first_name} {provider.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.providerId && (
                    <p className="text-xs text-destructive">{validationErrors.providerId}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Date *</Label>
              <Input
                id="appointmentDate"
                name="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => handleInputChange("appointmentDate", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={validationErrors.appointmentDate ? "border-destructive" : ""}
                required
              />
              {validationErrors.appointmentDate && (
                <p className="text-xs text-destructive">{validationErrors.appointmentDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointmentTime">Time *</Label>
              <Input
                id="appointmentTime"
                name="appointmentTime"
                type="time"
                value={formData.appointmentTime}
                onChange={(e) => handleInputChange("appointmentTime", e.target.value)}
                className={validationErrors.appointmentTime ? "border-destructive" : ""}
                required
              />
              {validationErrors.appointmentTime && (
                <p className="text-xs text-destructive">{validationErrors.appointmentTime}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Select
                name="durationMinutes"
                value={formData.durationMinutes ?? ""}
                onValueChange={(value) => handleInputChange("durationMinutes", value ?? "")}
                required
              >
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="50">50 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentType">Appointment Type *</Label>
              <div className="space-y-1">
                <Select
                  name="appointmentType"
                  value={formData.appointmentType ?? ""}
                  onValueChange={(value) => handleInputChange("appointmentType", value ?? "")}
                  required
                >
                  <SelectTrigger
                    id="appointmentType"
                    className={validationErrors.appointmentType ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual Therapy">Individual Therapy</SelectItem>
                    <SelectItem value="Group Therapy">Group Therapy</SelectItem>
                    <SelectItem value="Family Therapy">Family Therapy</SelectItem>
                    <SelectItem value="Medication Management">Medication Management</SelectItem>
                    <SelectItem value="Assessment">Assessment</SelectItem>
                    <SelectItem value="Crisis Intervention">Crisis Intervention</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.appointmentType && (
                  <p className="text-xs text-destructive">{validationErrors.appointmentType}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode">Mode *</Label>
              <Select name="mode" value={formData.mode ?? ""} onValueChange={(value) => handleInputChange("mode", value ?? "")} required>
                <SelectTrigger id="mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="telehealth">Telehealth</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" value={formData.status ?? ""} onValueChange={(value) => handleInputChange("status", value ?? "")}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Additional notes or special instructions"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAppointment.isPending || !isFormValid}>
              {createAppointment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Appointment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
