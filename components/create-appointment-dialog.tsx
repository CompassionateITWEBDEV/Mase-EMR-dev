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

interface CreateAppointmentDialogProps {
  children: React.ReactNode
  patients: Patient[]
  providers: Provider[]
  currentProviderId: string
}

export function CreateAppointmentDialog({
  children,
  patients,
  providers,
  currentProviderId,
}: CreateAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Debug: Log providers when dialog opens
  useEffect(() => {
    if (open) {
      console.log("[CreateAppointmentDialog] Dialog opened with providers:", providers.length, providers);
      console.log("[CreateAppointmentDialog] Current provider ID:", currentProviderId);
    }
  }, [open, providers, currentProviderId]);

  const [formData, setFormData] = useState({
    patientId: "",
    providerId: currentProviderId,
    appointmentDate: "",
    appointmentTime: "",
    durationMinutes: "50",
    appointmentType: "",
    mode: "in_person",
    status: "scheduled",
    notes: "",
  })

  // Update providerId when currentProviderId or providers change (only if not manually set by user)
  useEffect(() => {
    // Only auto-update if we don't have a provider selected
    // This prevents overwriting user selections
    if (currentProviderId) {
      setFormData((prev) => {
        // Only update if the current value is empty
        // This means it was auto-set, not manually selected
        if (!prev.providerId) {
          return { ...prev, providerId: currentProviderId };
        }
        return prev;
      });
    } else if (providers.length > 0) {
      // If no currentProviderId but providers are available, use first provider
      setFormData((prev) => {
        if (!prev.providerId) {
          return { ...prev, providerId: providers[0].id };
        }
        return prev;
      });
    }
  }, [currentProviderId, providers]);

  // Reset and initialize form when dialog opens
  useEffect(() => {
    if (open) {
      // When dialog opens, ensure provider is set to currentProviderId or first available
      const providerToUse = currentProviderId || (providers.length > 0 ? providers[0].id : "");
      setFormData({
        patientId: "",
        providerId: providerToUse,
        appointmentDate: "",
        appointmentTime: "",
        durationMinutes: "50",
        appointmentType: "",
        mode: "in_person",
        status: "scheduled",
        notes: "",
      });
    }
  }, [open, currentProviderId, providers]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Combine date and time into ISO string
      const appointmentDateTime = formData.appointmentDate && formData.appointmentTime
        ? `${formData.appointmentDate}T${formData.appointmentTime}:00`
        : formData.appointmentDate || null;

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        patient_id: formData.patientId,
          provider_id: formData.providerId || null,
          appointment_date: appointmentDateTime,
          duration_minutes: Number.parseInt(formData.durationMinutes) || 60,
        appointment_type: formData.appointmentType,
          status: formData.status || "scheduled",
        notes: formData.notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create appointment");
      }

      toast.success("Appointment created successfully")
      setOpen(false)
      // Form will be reset by the useEffect when dialog closes
      router.refresh()
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      console.error("Error creating appointment:", err)
      toast.error(err.message || "Failed to create appointment")
    } finally {
      setIsLoading(false)
    }
  }

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
              <Select
                value={formData.patientId}
                onValueChange={(value) => handleInputChange("patientId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.first_name} {patient.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              {providers.length > 0 ? (
                <Select
                  value={formData.providerId || ""}
                  onValueChange={(value) => handleInputChange("providerId", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.first_name} {provider.last_name} {provider.specialization && `(${provider.specialization})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-1">
                  <Input
                    disabled
                    placeholder="Loading providers..."
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Loading providers or no providers found. Please check your connection.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Date *</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => handleInputChange("appointmentDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointmentTime">Time *</Label>
              <Input
                id="appointmentTime"
                type="time"
                value={formData.appointmentTime}
                onChange={(e) => handleInputChange("appointmentTime", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Select
                value={formData.durationMinutes}
                onValueChange={(value) => handleInputChange("durationMinutes", value)}
                required
              >
                <SelectTrigger>
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
              <Select
                value={formData.appointmentType}
                onValueChange={(value) => handleInputChange("appointmentType", value)}
                required
              >
                <SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="mode">Mode *</Label>
              <Select value={formData.mode} onValueChange={(value) => handleInputChange("mode", value)} required>
                <SelectTrigger>
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
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger>
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
              placeholder="Additional notes or special instructions"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
