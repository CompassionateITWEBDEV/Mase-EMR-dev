"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, AlertTriangle, MessageSquare, Calendar, Pill, Users, CheckCircle, Clock, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Notification {
  id: string
  patient_id?: string
  notification_type: string
  title: string
  message: string
  action_url?: string
  priority: string
  is_read: boolean
  read_at?: string
  created_at: string
  expires_at?: string
  patients?: {
    first_name: string
    last_name: string
  }
  sender?: {
    first_name: string
    last_name: string
    role: string
  }
}

interface TeamNotificationsProps {
  providerId: string
  showHeader?: boolean
  maxItems?: number
}

export function TeamNotifications({ providerId, showHeader = true, maxItems }: TeamNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    try {
      let query = supabase
        .from("team_notifications")
        .select(`
          *,
          patients(
            first_name,
            last_name
          ),
          sender:providers!team_notifications_sender_id_fkey(
            first_name,
            last_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (providerId) {
        query = query.eq("recipient_id", providerId)
      }

      const { data, error } = await query

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [providerId, supabase])

  useEffect(() => {
    fetchNotifications()

    // Subscribe to real-time notifications
    const channel = supabase
      .channel("team_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_notifications",
        },
        () => {
          fetchNotifications()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications, supabase])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("team_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notificationId)

      if (error) throw error
      fetchNotifications()
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("team_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("recipient_id", providerId)
        .eq("is_read", false)

      if (error) throw error
      fetchNotifications()
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("Failed to mark all as read")
    }
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("team_notifications").delete().eq("id", notificationId)

      if (error) throw error
      fetchNotifications()
      toast.success("Notification dismissed")
    } catch (error) {
      console.error("Error dismissing notification:", error)
      toast.error("Failed to dismiss notification")
    }
  }

  const getNotificationIcon = (type: string, priority: string) => {
    const iconClass = priority === "urgent" ? "text-destructive" : "text-muted-foreground"

    switch (type) {
      case "risk_alert":
        return <AlertTriangle className={`h-4 w-4 ${iconClass}`} />
      case "case_message":
      case "urgent_message":
        return <MessageSquare className={`h-4 w-4 ${iconClass}`} />
      case "appointment_reminder":
        return <Calendar className={`h-4 w-4 ${iconClass}`} />
      case "medication_change":
        return <Pill className={`h-4 w-4 ${iconClass}`} />
      case "case_assignment":
        return <Users className={`h-4 w-4 ${iconClass}`} />
      default:
        return <Bell className={`h-4 w-4 ${iconClass}`} />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case "normal":
        return <Badge variant="secondary">Normal</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      risk_alert: "Risk Alert",
      case_message: "Case Message",
      urgent_message: "Urgent Message",
      appointment_reminder: "Appointment",
      medication_change: "Medication",
      case_assignment: "Team Assignment",
    }
    return labels[type] || type
  }

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !notification.is_read) ||
      (filter === "read" && notification.is_read) ||
      notification.notification_type === filter

    const matchesPriority = priorityFilter === "all" || notification.priority === priorityFilter

    return matchesFilter && matchesPriority
  })

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading notifications...</div>
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Team Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark All Read
                </Button>
              )}
            </div>
          </CardTitle>
          <CardDescription>Stay updated on patient cases and team communications</CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {showHeader && (
          <div className="flex gap-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="risk_alert">Risk Alerts</SelectItem>
                <SelectItem value="case_message">Messages</SelectItem>
                <SelectItem value="appointment_reminder">Appointments</SelectItem>
                <SelectItem value="medication_change">Medications</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === "unread" ? "No unread notifications" : "No notifications found"}
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border border-border rounded-lg p-4 transition-colors ${
                  !notification.is_read ? "bg-accent/50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.notification_type, notification.priority)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {getPriorityBadge(notification.priority)}
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(notification.notification_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.created_at).toLocaleString()}
                        </div>
                        {notification.patients && (
                          <span>
                            Patient: {notification.patients.first_name} {notification.patients.last_name}
                          </span>
                        )}
                        {notification.sender && (
                          <span>
                            From: {notification.sender.first_name} {notification.sender.last_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {!notification.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => dismissNotification(notification.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {notification.action_url && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <Link href={notification.action_url}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
