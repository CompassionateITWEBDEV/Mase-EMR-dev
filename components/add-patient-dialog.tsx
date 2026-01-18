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

interface AddPatientDialogProps {
  children: React.ReactNode
  providerId: string
  onSuccess?: () => void // Added optional onSuccess callback
}

export function AddPatientDialog({ children, providerId, onSuccess }: AddPatientDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    programType: "",
    phone: "",
    email: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    insuranceProvider: "",
    insuranceId: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender,
          program_type: formData.programType || null,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address || null,
          emergency_contact_name: formData.emergencyContactName || null,
          emergency_contact_phone: formData.emergencyContactPhone || null,
          insurance_provider: formData.insuranceProvider || null,
          insurance_id: formData.insuranceId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add patient")
      }

      toast.success("Patient added successfully")
      setOpen(false)
      setFormData({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        programType: "",
        phone: "",
        email: "",
        address: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        insuranceProvider: "",
        insuranceId: "",
      })

      if (onSuccess) {
        onSuccess()
      }

      router.refresh()
    } catch (error) {
      console.error("Error adding patient:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add patient")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>{"Enter the patient's information to create a new record."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary">Non-binary</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="programType">Program Type</Label>
              <Select onValueChange={(value) => handleInputChange("programType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="otp">OTP (Opioid Treatment Program)</SelectItem>
                  <SelectItem value="mat">MAT (Medication-Assisted Treatment)</SelectItem>
                  <SelectItem value="primary_care">Primary Care</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                required
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="patient@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              placeholder="Street address, city, state, zip"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
              <Input
                id="emergencyContactName"
                placeholder="Contact name"
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceProvider">Insurance Provider</Label>
              <Select onValueChange={(value) => handleInputChange("insuranceProvider", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select insurance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medicaid">Medicaid</SelectItem>
                  <SelectItem value="Medicare">Medicare</SelectItem>
                  <SelectItem value="Blue Cross Blue Shield">Blue Cross Blue Shield</SelectItem>
                  <SelectItem value="Aetna">Aetna</SelectItem>
                  <SelectItem value="Cigna">Cigna</SelectItem>
                  <SelectItem value="United Healthcare">United Healthcare</SelectItem>
                  <SelectItem value="Humana">Humana</SelectItem>
                  <SelectItem value="Private Pay">Private Pay</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceId">Insurance ID</Label>
              <Input
                id="insuranceId"
                placeholder="Insurance member ID"
                value={formData.insuranceId}
                onChange={(e) => handleInputChange("insuranceId", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
