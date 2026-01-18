"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
}

interface AppointmentCalendarProps {
  selectedDate: string
  appointments: Appointment[]
}

export function AppointmentCalendar({ selectedDate, appointments }: AppointmentCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [date, setDate] = useState<Date | undefined>(new Date(selectedDate))

  // Group appointments by date
  const appointmentsByDate = appointments.reduce(
    (acc, apt) => {
      const dateKey = apt.appointment_date
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(apt)
      return acc
    },
    {} as Record<string, Appointment[]>,
  )

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate)
      const dateString = newDate.toISOString().split("T")[0]
      const params = new URLSearchParams(searchParams.toString())
      params.set("date", dateString)
      router.push(`/appointments?${params.toString()}`)
    }
  }

  const modifiers = {
    hasAppointments: Object.keys(appointmentsByDate).map((date) => new Date(date)),
  }

  const modifiersStyles = {
    hasAppointments: {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
      borderRadius: "6px",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border"
        />

        {/* Show appointments for selected date */}
        {appointmentsByDate[selectedDate] && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">
              {appointmentsByDate[selectedDate].length} appointment(s) on {new Date(selectedDate).toLocaleDateString()}
            </h4>
            <div className="space-y-1">
              {appointmentsByDate[selectedDate].slice(0, 3).map((apt) => (
                <div key={apt.id} className="flex items-center justify-between text-xs">
                  <span>{apt.appointment_time}</span>
                  <Badge
                    variant={
                      apt.status === "confirmed" ? "default" : apt.status === "scheduled" ? "secondary" : "outline"
                    }
                    className="text-xs"
                  >
                    {apt.status}
                  </Badge>
                </div>
              ))}
              {appointmentsByDate[selectedDate].length > 3 && (
                <div className="text-xs text-muted-foreground">+{appointmentsByDate[selectedDate].length - 3} more</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
