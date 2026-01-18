"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Helper to parse date string in local timezone (avoids UTC offset issues)
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarIcon,
  Search,
  Clock,
  User,
  Video,
  MapPin,
  Phone,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { EditAppointmentDialog } from "./edit-appointment-dialog";
import { DeleteAppointmentDialog } from "./delete-appointment-dialog";
import { UpdateAppointmentStatusDialog } from "./update-appointment-status-dialog";

interface AppointmentData {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  appointment_type: string;
  mode: string;
  status: string;
  notes?: string;
  patient_id: string;
  provider_id: string | null;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
  providers: {
    id: string;
    first_name: string;
    last_name: string;
    title?: string;
  } | null;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
}

interface Provider {
  id: string;
  first_name: string;
  last_name: string;
  title?: string;
}

interface AppointmentListProps {
  todayAppointments: AppointmentData[];
  upcomingAppointments: AppointmentData[];
  pastAppointments: AppointmentData[];
  selectedDate: string;
  currentProviderId: string;
  patients: Patient[];
  providers: Provider[];
}

export function AppointmentList({
  todayAppointments,
  upcomingAppointments,
  pastAppointments,
  selectedDate,
  currentProviderId,
  patients,
  providers,
}: AppointmentListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "scheduled":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "no_show":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getModeIcon = (mode: string) => {
    return mode === "telehealth" ? (
      <Video className="h-4 w-4 text-blue-500" />
    ) : (
      <MapPin className="h-4 w-4 text-green-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      confirmed: "default",
      scheduled: "secondary",
      no_show: "destructive",
      cancelled: "outline",
      completed: "default",
    } as const;
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const filterAppointments = (appointments: AppointmentData[]) => {
    if (!searchTerm) return appointments;

    return appointments.filter(
      (apt) =>
        `${apt.patients.first_name} ${apt.patients.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (apt.providers &&
          `${apt.providers.first_name} ${apt.providers.last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        apt.appointment_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const AppointmentCard = ({
    appointment,
    showDate = false,
  }: {
    appointment: AppointmentData;
    showDate?: boolean;
  }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="text-center">
          {showDate && (
            <div className="font-semibold text-sm">
              {parseLocalDate(appointment.appointment_date).toLocaleDateString()}
            </div>
          )}
          <div className="font-semibold text-sm">
            {formatTime(appointment.appointment_time)}
          </div>
          <div className="text-xs text-muted-foreground">
            {appointment.duration_minutes} min
          </div>
        </div>
        <div className="w-px h-12 bg-border" />
        <div>
          <h4 className="font-medium">
            {appointment.patients.first_name} {appointment.patients.last_name}
          </h4>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <span>
              {appointment.providers ? (
                <>
                  {appointment.providers.first_name}{" "}
                  {appointment.providers.last_name}
                  {appointment.providers.title && (
                    <>, {appointment.providers.title}</>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground italic">No Provider Assigned</span>
              )}
            </span>
            <span>•</span>
            <span>{appointment.appointment_type}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {getModeIcon(appointment.mode)}
          {getStatusIcon(appointment.status)}
        </div>
        <div className="text-right">{getStatusBadge(appointment.status)}</div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {appointment.patients.phone && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`tel:${appointment.patients.phone}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
          )}

          <UpdateAppointmentStatusDialog appointment={appointment}>
            <Button variant="ghost" size="sm">
              <CheckCircle className="h-4 w-4" />
            </Button>
          </UpdateAppointmentStatusDialog>

          {appointment.providers?.id === currentProviderId && (
            <>
              <EditAppointmentDialog
                appointment={appointment}
                patients={patients}
                providers={providers}>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </EditAppointmentDialog>

              <DeleteAppointmentDialog
                appointmentId={appointment.id}
                patientName={`${appointment.patients.first_name} ${appointment.patients.last_name}`}
                appointmentDate={appointment.appointment_date}
                appointmentTime={appointment.appointment_time}>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DeleteAppointmentDialog>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Tabs defaultValue="today" className="space-y-6">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <TabsContent value="today">
        <Card>
          <CardHeader>
            <CardTitle>{"Today's Appointments"}</CardTitle>
            <CardDescription>
              {parseLocalDate(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filterAppointments(todayAppointments).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No appointments found for today.
                </div>
              ) : (
                filterAppointments(todayAppointments).map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="upcoming">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filterAppointments(upcomingAppointments).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming appointments found.
                </div>
              ) : (
                filterAppointments(upcomingAppointments).map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    showDate
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="past">
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
            <CardDescription>
              Previous appointments and sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filterAppointments(pastAppointments).length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No Past Appointments
                  </h3>
                  <p className="text-muted-foreground">
                    Past appointments will appear here
                  </p>
                </div>
              ) : (
                filterAppointments(pastAppointments).map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    showDate
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
