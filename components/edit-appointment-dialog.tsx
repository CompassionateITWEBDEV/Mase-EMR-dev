"use client"

import type React from "react"

import { useState } from "react"
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

interface AppointmentData {
  id: string
  patient_id: string
  provider_id: string | null
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  appointment_type: string
  mode: string
  status: string
  notes?: string
  patients?: {
    id: string
    first_name: string
    last_name: string
  }
  providers?: {
    id: string
    first_name: string
    last_name: string
    title?: string
  } | null
}

interface Patient {
  id: string
  first_name: string
  last_name: string
}

interface Provider {
  id: string
  first_name: string
  last_name: string
  title?: string
}

interface EditAppointmentDialogProps {
  children: React.ReactNode
  appointment: AppointmentData
  patients: Patient[]
  providers: Provider[]
}

export function EditAppointmentDialog({ children, appointment, patients, providers }: EditAppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Parse appointment_date timestamp into separate date and time
  const parseAppointmentDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return { date: "", time: "" }
    try {
      const date = new Date(dateTimeStr)
      return {
        date: date.toISOString().split("T")[0],
        time: date.toTimeString().slice(0, 5), // HH:MM format
      }
    } catch {
      // If it's already in date format (YYYY-MM-DD), use it as is
      if (dateTimeStr.includes("T")) {
        const date = new Date(dateTimeStr)
        return {
          date: date.toISOString().split("T")[0],
          time: date.toTimeString().slice(0, 5),
        }
      }
      return { date: dateTimeStr, time: appointment.appointment_time || "" }
    }
  }

  const parsedDateTime = parseAppointmentDateTime(appointment.appointment_date)

  const [formData, setFormData] = useState({
    patientId: appointment.patient_id,
    providerId: appointment.provider_id || "",
    appointmentDate: parsedDateTime.date,
    appointmentTime: parsedDateTime.time,
    durationMinutes: appointment.duration_minutes.toString(),
    appointmentType: appointment.appointment_type,
    mode: appointment.mode || "in_person",
    status: appointment.status,
    notes: appointment.notes || "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Combine date and time into ISO timestamp
      const appointmentDateTime = formData.appointmentDate && formData.appointmentTime
        ? `${formData.appointmentDate}T${formData.appointmentTime}:00`
        : formData.appointmentDate || null

      if (!appointmentDateTime) {
        toast.error("Appointment date and time are required")
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_id: formData.patientId,
          provider_id: formData.providerId || null,
          appointment_date: appointmentDateTime,
          duration_minutes: Number.parseInt(formData.durationMinutes) || 60,
          appointment_type: formData.appointmentType,
          mode: formData.mode,
          status: formData.status,
          notes: formData.notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update appointment")
      }

      toast.success("Appointment updated successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating appointment:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update appointment"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>Update appointment details.</DialogDescription>
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
              <Select
                value={formData.providerId}
                onValueChange={(value) => handleInputChange("providerId", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.first_name} {provider.last_name} {provider.title && `(${provider.title})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {isLoading ? "Updating..." : "Update Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
