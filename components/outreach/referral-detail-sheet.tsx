"use client"

import { useState } from "react"
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  Building2,
  FileText,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Referral {
  id: string
  clientName: string
  referralType: string
  referrerOrg?: string
  referrerName?: string
  status: string
  urgency: string
  concerns: string[]
  submittedAt: string
  email: string
  phone: string
  preferredContact: string
  insurance: string
  lastContact: string | null
  appointmentDate?: string
  notes: { date: string; text: string }[]
}

interface ReferralDetailSheetProps {
  referral: Referral | null
  onClose: () => void
}

const statusConfig = {
  new: { label: "New", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  contacted: { label: "Contacted", color: "bg-yellow-100 text-yellow-700", icon: Phone },
  scheduled: { label: "Scheduled", color: "bg-green-100 text-green-700", icon: Calendar },
  "no-response": { label: "No Response", color: "bg-orange-100 text-orange-700", icon: XCircle },
  completed: { label: "Completed", color: "bg-teal-100 text-teal-700", icon: CheckCircle2 },
}

export function ReferralDetailSheet({ referral, onClose }: ReferralDetailSheetProps) {
  const [newNote, setNewNote] = useState("")
  const [currentStatus, setCurrentStatus] = useState(referral?.status || "new")

  if (!referral) return null

  const status = statusConfig[referral.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }

  return (
    <Sheet open={!!referral} onOpenChange={onClose}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{referral.clientName}</SheetTitle>
              <SheetDescription>{referral.id}</SheetDescription>
            </div>
            <Badge className={cn(status.color)}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
              <a href={`tel:${referral.phone}`}>
                <Phone className="mr-2 h-4 w-4" />
                Call
              </a>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
              <a href={`mailto:${referral.email}`}>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </a>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 bg-transparent" asChild>
              <a href={`sms:${referral.phone}`}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Text
              </a>
            </Button>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{referral.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{referral.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span>Prefers: {referral.preferredContact}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Referral Details */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Referral Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                {referral.referralType === "professional" ? (
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="capitalize">{referral.referralType} Referral</span>
              </div>
              {referral.referralType === "professional" && (
                <div className="ml-7 text-sm text-muted-foreground">
                  {referral.referrerName} • {referral.referrerOrg}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Submitted: {formatDate(referral.submittedAt)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>Insurance: {referral.insurance}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Concerns */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Primary Concerns</h3>
            <div className="flex flex-wrap gap-2">
              {referral.concerns.map((concern) => (
                <Badge key={concern} variant="secondary">
                  {concern}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Update Status */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Update Status</h3>
            <Select value={currentStatus} onValueChange={setCurrentStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="no-response">No Response</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Notes & Activity</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                />
              </div>
              <Button size="sm" disabled={!newNote.trim()} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </div>
            {referral.notes.length > 0 && (
              <div className="mt-4 space-y-3">
                {referral.notes.map((note, index) => (
                  <div key={index} className="rounded-lg bg-muted/50 p-3">
                    <div className="mb-1 text-xs text-muted-foreground">{note.date}</div>
                    <div className="text-sm">{note.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700">
              <User className="mr-2 h-4 w-4" />
              Convert to Patient
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
