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
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle } from "lucide-react"

interface DeletePatientDialogProps {
  children: React.ReactNode
  patientId: string
  patientName: string
  onSuccess?: () => void
}

export function DeletePatientDialog({ children, patientId, patientName, onSuccess }: DeletePatientDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to deactivate patient")
      }

      toast.success("Patient deactivated successfully")
      setOpen(false)
      
      // Call onSuccess callback to refresh patient list without page refresh
      if (onSuccess) {
        onSuccess()
      } else {
        // Fallback to router refresh if no callback provided
        router.refresh()
      }
    } catch (error) {
      console.error("Error deleting patient:", error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to deactivate patient. Please try again."
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Deactivate Patient
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to deactivate <strong>{patientName}</strong>? This will mark the patient as inactive.
            Patient data will be preserved but hidden from active lists. You can reactivate the patient later if needed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading ? "Deactivating..." : "Deactivate Patient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
