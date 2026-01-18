"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Medication {
  id?: string
  medication_name: string
  generic_name?: string
  dosage: string
  frequency: string
  route?: string
  start_date: string
  end_date?: string
  medication_type?: string
  notes?: string
  status?: string
  discontinuation_reason?: string
}

interface PatientMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  medication?: Medication | null
  onSuccess: () => void
  mode: "add" | "edit"
}

const FREQUENCY_OPTIONS = [
  "once daily",
  "twice daily",
  "three times daily",
  "four times daily",
  "every 4 hours",
  "every 6 hours",
  "every 8 hours",
  "every 12 hours",
  "at bedtime",
  "as needed",
  "weekly",
  "every other day",
]

const ROUTE_OPTIONS = [
  "oral",
  "sublingual",
  "topical",
  "injection",
  "inhalation",
  "rectal",
  "nasal",
  "ophthalmic",
  "otic",
  "transdermal",
]

const MEDICATION_TYPE_OPTIONS = [
  { value: "regular", label: "Regular" },
  { value: "prn", label: "PRN (As Needed)" },
  { value: "controlled", label: "Controlled Substance" },
]

export function PatientMedicationDialog({
  open,
  onOpenChange,
  patientId,
  medication,
  onSuccess,
  mode,
}: PatientMedicationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const [formData, setFormData] = useState<Medication>({
    medication_name: "",
    generic_name: "",
    dosage: "",
    frequency: "once daily",
    route: "oral",
    start_date: new Date().toISOString().split("T")[0],
    medication_type: "regular",
    notes: "",
  })

  // Reset form when dialog opens/closes or medication changes
  useEffect(() => {
    if (open && medication && mode === "edit") {
      setFormData({
        id: medication.id,
        medication_name: medication.medication_name || "",
        generic_name: medication.generic_name || "",
        dosage: medication.dosage || "",
        frequency: medication.frequency || "once daily",
        route: medication.route || "oral",
        start_date: medication.start_date || new Date().toISOString().split("T")[0],
        medication_type: medication.medication_type || "regular",
        notes: medication.notes || "",
      })
    } else if (open && mode === "add") {
      setFormData({
        medication_name: "",
        generic_name: "",
        dosage: "",
        frequency: "once daily",
        route: "oral",
        start_date: new Date().toISOString().split("T")[0],
        medication_type: "regular",
        notes: "",
      })
    }
  }, [open, medication, mode])

  const handleSubmit = async () => {
    if (!formData.medication_name || !formData.dosage || !formData.frequency) {
      toast({
        title: "Validation Error",
        description: "Please fill in medication name, dosage, and frequency",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const url = `/api/patients/${patientId}/medications`
      const method = mode === "add" ? "POST" : "PUT"
      
      const body = mode === "edit" 
        ? { medication_id: formData.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: mode === "add" 
            ? "Medication added successfully" 
            : "Medication updated successfully",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || `Failed to ${mode} medication`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Failed to ${mode} medication:`, error)
      toast({
        title: "Error",
        description: `Failed to ${mode} medication`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add New Medication" : "Edit Medication"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" 
              ? "Add a medication to the patient's active medication list" 
              : "Update the medication details"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="medication_name">Medication Name *</Label>
              <Input
                id="medication_name"
                value={formData.medication_name}
                onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                placeholder="e.g., Metformin"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="generic_name">Generic Name</Label>
              <Input
                id="generic_name"
                value={formData.generic_name}
                onChange={(e) => setFormData(prev => ({ ...prev, generic_name: e.target.value }))}
                placeholder="e.g., metformin hydrochloride"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 500mg"
              />
            </div>
            
            <div>
              <Label htmlFor="frequency">Frequency *</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="route">Route</Label>
              <Select
                value={formData.route}
                onValueChange={(value) => setFormData(prev => ({ ...prev, route: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTE_OPTIONS.map((route) => (
                    <SelectItem key={route} value={route}>
                      {route.charAt(0).toUpperCase() + route.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="medication_type">Type</Label>
              <Select
                value={formData.medication_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, medication_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICATION_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this medication..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "add" ? "Add Medication" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DiscontinueMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  medication: Medication | null
  onSuccess: () => void
}

export function DiscontinueMedicationDialog({
  open,
  onOpenChange,
  patientId,
  medication,
  onSuccess,
}: DiscontinueMedicationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reason, setReason] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setReason("")
    }
  }, [open])

  const handleDiscontinue = async () => {
    if (!medication?.id) return

    setIsSubmitting(true)
    try {
      const params = new URLSearchParams({
        medication_id: medication.id,
        reason: reason || "Discontinued by provider",
      })

      const response = await fetch(
        `/api/patients/${patientId}/medications?${params.toString()}`,
        { method: "DELETE" }
      )

      if (response.ok) {
        toast({
          title: "Medication Discontinued",
          description: `${medication.medication_name} has been discontinued`,
        })
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to discontinue medication",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to discontinue medication:", error)
      toast({
        title: "Error",
        description: "Failed to discontinue medication",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discontinue Medication</DialogTitle>
          <DialogDescription>
            Are you sure you want to discontinue{" "}
            <strong>{medication?.medication_name}</strong>? This action will mark
            the medication as discontinued in the patient's record.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="reason">Reason for Discontinuation</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for discontinuing this medication..."
            rows={3}
            className="mt-2"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDiscontinue} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Discontinue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
