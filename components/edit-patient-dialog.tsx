"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  email: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_provider?: string;
  insurance_id?: string;
  program_type?: string;
}

interface EditPatientDialogProps {
  children: React.ReactNode;
  patient: Patient;
  onSuccess?: () => void;
}

export function EditPatientDialog({
  children,
  patient,
  onSuccess,
}: EditPatientDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if the current program type is a standard one or custom
  const standardProgramTypes = ["otp", "mat", "primary_care", "sub", "beh"];
  const isCustomProgramType = patient.program_type && !standardProgramTypes.includes(patient.program_type.toLowerCase().trim());
  
  const [formData, setFormData] = useState({
    firstName: patient.first_name,
    lastName: patient.last_name,
    dateOfBirth: patient.date_of_birth,
    gender: patient.gender || "",
    programType: isCustomProgramType ? "custom" : (patient.program_type || ""),
    customProgramType: isCustomProgramType ? (patient.program_type || "") : "",
    phone: patient.phone || "",
    email: patient.email || "",
    address: patient.address || "",
    emergencyContactName: patient.emergency_contact_name || "",
    emergencyContactPhone: patient.emergency_contact_phone || "",
    insuranceProvider: patient.insurance_provider || "",
    insuranceId: patient.insurance_id || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If custom program type is selected, validate custom input
    if (formData.programType === "custom" && !formData.customProgramType.trim()) {
      toast.error("Please enter a custom program type");
      return;
    }
    
    setIsLoading(true);

    try {
      // Use custom program type if "custom" is selected, otherwise use the selected program type
      const finalProgramType = formData.programType === "custom" 
        ? formData.customProgramType.trim() 
        : formData.programType;
      
      // Use API route instead of direct Supabase client to bypass RLS
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender || null,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address || null,
          emergency_contact_name: formData.emergencyContactName || null,
          emergency_contact_phone: formData.emergencyContactPhone || null,
          insurance_provider: formData.insuranceProvider || null,
          insurance_id: formData.insuranceId || null,
          program_type: finalProgramType || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update patient");
      }

      console.log("[Edit Patient] Update successful:", data);
      console.log("[Edit Patient] Updated program_type:", data.patient?.program_type);

      toast.success("Patient updated successfully");
      setOpen(false);
      
      // Dispatch event to notify chart to refresh
      window.dispatchEvent(new Event('patient-updated'));
      
      // Call onSuccess callback to refresh patient list without page refresh
      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback to router refresh if no callback provided
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to update patient. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
          <DialogDescription>
            {"Update the patient's information."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Same form fields as AddPatientDialog but with pre-filled values */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
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
                name="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                name="gender"
                value={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary">Non-binary</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="programType">Program Type</Label>
              <Select
                name="programType"
                value={formData.programType || undefined}
                onValueChange={(value) => {
                  handleInputChange("programType", value);
                  // Clear custom program type when switching away from custom
                  if (value !== "custom") {
                    handleInputChange("customProgramType", "");
                  }
                }}>
                <SelectTrigger id="programType">
                  <SelectValue placeholder="Select program type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="otp">OTP (Opioid Treatment Program)</SelectItem>
                  <SelectItem value="mat">MAT (Medication-Assisted Treatment)</SelectItem>
                  <SelectItem value="primary_care">Primary Care</SelectItem>
                  <SelectItem value="sub">SUB (Substance Use)</SelectItem>
                  <SelectItem value="beh">BEH (Behavioral Health)</SelectItem>
                  <SelectItem value="custom">Custom Program</SelectItem>
                </SelectContent>
              </Select>
              {formData.programType === "custom" && (
                <Input
                  id="customProgramType"
                  name="customProgramType"
                  placeholder="Enter custom program type"
                  value={formData.customProgramType}
                  onChange={(e) => handleInputChange("customProgramType", e.target.value)}
                  required
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone ?? ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email ?? ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address ?? ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">
                Emergency Contact Name
              </Label>
              <Input
                id="emergencyContactName"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) =>
                  handleInputChange("emergencyContactName", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactPhone">
                Emergency Contact Phone
              </Label>
              <Input
                id="emergencyContactPhone"
                name="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) =>
                  handleInputChange("emergencyContactPhone", e.target.value)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insuranceProvider">Insurance Provider</Label>
              <Select
                value={formData.insuranceProvider}
                onValueChange={(value) =>
                  handleInputChange("insuranceProvider", value)
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select insurance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medicaid">Medicaid</SelectItem>
                  <SelectItem value="Medicare">Medicare</SelectItem>
                  <SelectItem value="Blue Cross Blue Shield">
                    Blue Cross Blue Shield
                  </SelectItem>
                  <SelectItem value="Aetna">Aetna</SelectItem>
                  <SelectItem value="Cigna">Cigna</SelectItem>
                  <SelectItem value="United Healthcare">
                    United Healthcare
                  </SelectItem>
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
                name="insuranceId"
                value={formData.insuranceId}
                onChange={(e) =>
                  handleInputChange("insuranceId", e.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Patient"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
