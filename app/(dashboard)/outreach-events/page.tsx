"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Plus, Edit, Trash2, MapPin, Clock, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function OutreachEventsManagement() {
  const { toast } = useToast()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)

  const [eventForm, setEventForm] = useState({
    event_title: "",
    event_description: "",
    event_type: "workshop",
    event_date: "",
    start_time: "",
    end_time: "",
    location_name: "",
    location_address: "",
    location_city: "",
    location_state: "DC",
    location_zip: "",
    location_type: "in_person",
    virtual_link: "",
    requires_registration: false,
    max_attendees: 0,
    contact_email: "",
    contact_phone: "",
    cost: 0,
    is_public: true,
    is_featured: false,
    status: "published",
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/community-outreach/events")
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async () => {
    try {
      const response = await fetch("/api/community-outreach/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventForm),
      })

      if (response.ok) {
        toast({
          title: "Event Created",
          description: "Community event has been successfully created",
        })
        setShowCreateDialog(false)
        resetForm()
        fetchEvents()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    }
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent) return

    try {
      const response = await fetch(`/api/community-outreach/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventForm),
      })

      if (response.ok) {
        toast({
          title: "Event Updated",
          description: "Community event has been successfully updated",
        })
        setEditingEvent(null)
        resetForm()
        fetchEvents()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const response = await fetch(`/api/community-outreach/events/${eventId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Event Deleted",
          description: "Community event has been deleted",
        })
        fetchEvents()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setEventForm({
      event_title: "",
      event_description: "",
      event_type: "workshop",
      event_date: "",
      start_time: "",
      end_time: "",
      location_name: "",
      location_address: "",
      location_city: "",
      location_state: "DC",
      location_zip: "",
      location_type: "in_person",
      virtual_link: "",
      requires_registration: false,
      max_attendees: 0,
      contact_email: "",
      contact_phone: "",
      cost: 0,
      is_public: true,
      is_featured: false,
      status: "published",
    })
  }

  const openEditDialog = (event: any) => {
    setEditingEvent(event)
    setEventForm({
      event_title: event.event_title,
      event_description: event.event_description,
      event_type: event.event_type,
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      location_name: event.location_name,
      location_address: event.location_address,
      location_city: event.location_city,
      location_state: event.location_state,
      location_zip: event.location_zip,
      location_type: event.location_type,
      virtual_link: event.virtual_link || "",
      requires_registration: event.requires_registration,
      max_attendees: event.max_attendees || 0,
      contact_email: event.contact_email || "",
      contact_phone: event.contact_phone || "",
      cost: event.cost || 0,
      is_public: event.is_public,
      is_featured: event.is_featured,
      status: event.status,
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Community Events Management</h1>
          <p className="text-muted-foreground">Create and manage public events for the community outreach portal</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p>Loading events...</p>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No events found. Create your first community event!</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{event.event_title}</CardTitle>
                    <CardDescription className="mt-2">{event.event_description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(event)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(event.event_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {event.start_time} - {event.end_time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location_name || event.location_type}</span>
                  </div>
                  {event.requires_registration && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {event.current_attendees || 0} / {event.max_attendees || 0} registered
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={showCreateDialog || editingEvent !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setEditingEvent(null)
            resetForm()
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
            <DialogDescription>
              {editingEvent ? "Update event details" : "Add a new community event to the outreach portal"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event_title">Event Title *</Label>
              <Input
                id="event_title"
                value={eventForm.event_title}
                onChange={(e) => setEventForm({ ...eventForm, event_title: e.target.value })}
                placeholder="Mental Health Support Group"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_description">Description *</Label>
              <Textarea
                id="event_description"
                value={eventForm.event_description}
                onChange={(e) => setEventForm({ ...eventForm, event_description: e.target.value })}
                placeholder="Describe the event..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <select
                  id="event_type"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                >
                  <option value="workshop">Workshop</option>
                  <option value="support_group">Support Group</option>
                  <option value="health_fair">Health Fair</option>
                  <option value="training">Training</option>
                  <option value="community_meeting">Community Meeting</option>
                  <option value="social_event">Social Event</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_type">Location Type</Label>
                <select
                  id="location_type"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  value={eventForm.location_type}
                  onChange={(e) => setEventForm({ ...eventForm, location_type: e.target.value })}
                >
                  <option value="in_person">In-Person</option>
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_date">Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={eventForm.start_time}
                  onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={eventForm.end_time}
                  onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })}
                />
              </div>
            </div>

            {eventForm.location_type !== "virtual" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="location_name">Location Name</Label>
                  <Input
                    id="location_name"
                    value={eventForm.location_name}
                    onChange={(e) => setEventForm({ ...eventForm, location_name: e.target.value })}
                    placeholder="Community Wellness Center"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_address">Street Address</Label>
                  <Input
                    id="location_address"
                    value={eventForm.location_address}
                    onChange={(e) => setEventForm({ ...eventForm, location_address: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_city">City</Label>
                    <Input
                      id="location_city"
                      value={eventForm.location_city}
                      onChange={(e) => setEventForm({ ...eventForm, location_city: e.target.value })}
                      placeholder="Washington"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_state">State</Label>
                    <Input
                      id="location_state"
                      value={eventForm.location_state}
                      onChange={(e) => setEventForm({ ...eventForm, location_state: e.target.value })}
                      placeholder="DC"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location_zip">ZIP</Label>
                    <Input
                      id="location_zip"
                      value={eventForm.location_zip}
                      onChange={(e) => setEventForm({ ...eventForm, location_zip: e.target.value })}
                      placeholder="20001"
                    />
                  </div>
                </div>
              </>
            )}

            {(eventForm.location_type === "virtual" || eventForm.location_type === "hybrid") && (
              <div className="space-y-2">
                <Label htmlFor="virtual_link">Virtual Link</Label>
                <Input
                  id="virtual_link"
                  value={eventForm.virtual_link}
                  onChange={(e) => setEventForm({ ...eventForm, virtual_link: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={eventForm.contact_email}
                  onChange={(e) => setEventForm({ ...eventForm, contact_email: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={eventForm.contact_phone}
                  onChange={(e) => setEventForm({ ...eventForm, contact_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_attendees">Max Attendees</Label>
                <Input
                  id="max_attendees"
                  type="number"
                  value={eventForm.max_attendees}
                  onChange={(e) => setEventForm({ ...eventForm, max_attendees: Number.parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={eventForm.cost}
                  onChange={(e) => setEventForm({ ...eventForm, cost: Number.parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventForm.is_featured}
                  onChange={(e) => setEventForm({ ...eventForm, is_featured: e.target.checked })}
                />
                <span className="text-sm">Feature this event</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={eventForm.requires_registration}
                  onChange={(e) => setEventForm({ ...eventForm, requires_registration: e.target.checked })}
                />
                <span className="text-sm">Requires registration</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingEvent(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}>
                {editingEvent ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
