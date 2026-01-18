"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, FileText, Calendar, ClipboardList, TestTube, CreditCard, FileCheck, Pill } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const quickActions = [
  {
    title: "New Patient Intake",
    description: "Start biopsychosocial assessment",
    icon: UserPlus,
    color: "bg-cyan-600 text-white",
    action: "navigate",
    path: "/intake",
  },
  {
    title: "SOAP Note",
    description: "Document patient session",
    icon: FileText,
    color: "bg-slate-600 text-white",
    action: "dialog",
    dialogType: "soap",
  },
  {
    title: "Schedule Appointment",
    description: "Book patient visit",
    icon: Calendar,
    color: "bg-emerald-600 text-white",
    action: "navigate",
    path: "/appointments",
  },
  {
    title: "ASAM Assessment",
    description: "Complete ASAM criteria",
    icon: ClipboardList,
    color: "bg-violet-600 text-white",
    action: "navigate",
    path: "/assessments",
  },
  {
    title: "Insurance Verification",
    description: "Check patient coverage",
    icon: CreditCard,
    color: "bg-amber-600 text-white",
    action: "navigate",
    path: "/insurance",
  },
  {
    title: "Prior Authorization",
    description: "Submit new auth request",
    icon: FileCheck,
    color: "bg-rose-600 text-white",
    action: "navigate",
    path: "/insurance",
  },
  {
    title: "PMP Check",
    description: "Search prescription history",
    icon: Pill,
    color: "bg-indigo-600 text-white",
    action: "dialog",
    dialogType: "pmp",
  },
  {
    title: "UDS Collection",
    description: "Record drug screening",
    icon: TestTube,
    color: "bg-teal-600 text-white",
    action: "dialog",
    dialogType: "uds",
  },
]

export function QuickActions() {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<string | null>(null)
  const [patientId, setPatientId] = useState("")

  const handleActionClick = (action: (typeof quickActions)[0]) => {
    if (action.action === "navigate" && action.path) {
      router.push(action.path)
    } else if (action.action === "dialog" && action.dialogType) {
      setDialogType(action.dialogType)
      setDialogOpen(true)
    }
  }

  const handleDialogSubmit = () => {
    if (!patientId.trim()) return

    switch (dialogType) {
      case "soap":
        router.push(`/clinical-notes?patient=${encodeURIComponent(patientId)}`)
        break
      case "pmp":
        router.push(`/pmp?patient=${encodeURIComponent(patientId)}`)
        break
      case "uds":
        router.push(`/patients?uds=${encodeURIComponent(patientId)}`)
        break
    }

    setDialogOpen(false)
    setPatientId("")
  }

  const getDialogTitle = () => {
    switch (dialogType) {
      case "soap":
        return "Create SOAP Note"
      case "pmp":
        return "PMP Check"
      case "uds":
        return "UDS Collection"
      default:
        return "Select Patient"
    }
  }

  const getDialogDescription = () => {
    switch (dialogType) {
      case "soap":
        return "Enter the patient ID to create a new SOAP note"
      case "pmp":
        return "Enter the patient ID to check prescription monitoring data"
      case "uds":
        return "Enter the patient ID to record drug screening results"
      default:
        return "Enter patient information"
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-2 hover:bg-gray-50 bg-transparent border-gray-200"
                onClick={() => handleActionClick(action)}
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">{action.title}</p>
                  <p className="text-xs text-gray-500">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient ID or Name</Label>
              <Input
                id="patientId"
                placeholder="Enter patient ID or name..."
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDialogSubmit()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDialogSubmit} disabled={!patientId.trim()}>
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
