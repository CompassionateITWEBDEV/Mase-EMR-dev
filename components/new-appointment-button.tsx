"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreateAppointmentDialog } from "./create-appointment-dialog"
import type { Patient, Provider } from "@/types/patient"

interface NewAppointmentButtonProps {
  patients?: Patient[]
  providers?: Provider[]
  currentProviderId?: string
}

export function NewAppointmentButton({
  patients,
  providers,
  currentProviderId,
}: NewAppointmentButtonProps) {
  return (
    <CreateAppointmentDialog
      patients={patients}
      providers={providers}
      currentProviderId={currentProviderId}
    >
      <Button className="bg-teal-600 hover:bg-teal-700 text-white">
        <Plus className="mr-2 h-4 w-4" />
        New Appointment
      </Button>
    </CreateAppointmentDialog>
  )
}
