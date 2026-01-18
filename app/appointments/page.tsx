import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AppointmentCalendar } from "@/components/appointment-calendar"
import { AppointmentList } from "@/components/appointment-list"
import { AppointmentStats } from "@/components/appointment-stats"
import { CreateAppointmentDialog } from "@/components/create-appointment-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

const DEFAULT_PROVIDER = {
  id: "00000000-0000-0000-0000-000000000001",
  first_name: "Demo",
  last_name: "Provider",
  email: "demo@example.com",
  role: "physician",
  specialization: "General",
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  let provider = DEFAULT_PROVIDER
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: providerData } = await supabase.from("providers").select("*").eq("id", user.id).single()
      if (providerData) {
        provider = providerData
      }
    }
  } catch (error) {
    console.log("[v0] Auth check failed, using default provider")
  }

  // Get date parameter or default to today
  const selectedDate = typeof params.date === "string" ? params.date : new Date().toISOString().split("T")[0]

  // Fetch appointments for the selected date and upcoming
  const { data: todayAppointments } = await supabase
    .from("appointments")
    .select(`
      *,
      patients(
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      providers(
        id,
        first_name,
        last_name,
        specialization
      )
    `)
    .gte("appointment_date", selectedDate)
    .lt(
      "appointment_date",
      new Date(new Date(selectedDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    )
    .order("appointment_time", { ascending: true })

  // Fetch upcoming appointments (next 7 days)
  const nextWeek = new Date(new Date(selectedDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const { data: upcomingAppointments } = await supabase
    .from("appointments")
    .select(`
      *,
      patients(
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      providers(
        id,
        first_name,
        last_name,
        specialization
      )
    `)
    .gt("appointment_date", selectedDate)
    .lte("appointment_date", nextWeek)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true })

  // Fetch past appointments (last 30 days)
  const lastMonth = new Date(new Date(selectedDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const { data: pastAppointments } = await supabase
    .from("appointments")
    .select(`
      *,
      patients(
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      providers(
        id,
        first_name,
        last_name,
        specialization
      )
    `)
    .lt("appointment_date", selectedDate)
    .gte("appointment_date", lastMonth)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false })

  // Get patients and providers for appointment creation
  const { data: patients } = await supabase
    .from("patients")
    .select("id, first_name, last_name, phone, email")
    .order("first_name")
  const { data: providers } = await supabase
    .from("providers")
    .select("id, first_name, last_name, specialization")
    .order("first_name")

  // Calculate appointment statistics
  const allAppointments = [...(todayAppointments || []), ...(upcomingAppointments || []), ...(pastAppointments || [])]
  const todayStats = {
    total: todayAppointments?.length || 0,
    confirmed: todayAppointments?.filter((apt) => apt.status === "confirmed").length || 0,
    pending: todayAppointments?.filter((apt) => apt.status === "scheduled").length || 0,
    noShows: todayAppointments?.filter((apt) => apt.status === "no_show").length || 0,
    cancelled: todayAppointments?.filter((apt) => apt.status === "cancelled").length || 0,
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-work-sans)]">
                Appointment Management
              </h1>
              <p className="text-muted-foreground">Schedule and manage patient appointments and sessions</p>
            </div>
            <CreateAppointmentDialog
              patients={patients || []}
              providers={providers || []}
              currentProviderId={provider.id}
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Appointment
              </Button>
            </CreateAppointmentDialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar and Stats Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <AppointmentCalendar selectedDate={selectedDate} appointments={allAppointments} />
              <AppointmentStats stats={todayStats} />
            </div>

            {/* Appointments List */}
            <div className="lg:col-span-2">
              <AppointmentList
                todayAppointments={todayAppointments || []}
                upcomingAppointments={upcomingAppointments || []}
                pastAppointments={pastAppointments || []}
                selectedDate={selectedDate}
                currentProviderId={provider.id}
                patients={patients || []}
                providers={providers || []}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
