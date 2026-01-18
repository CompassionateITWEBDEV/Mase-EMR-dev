import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AppointmentStatsProps {
  stats: {
    total: number
    confirmed: number
    pending: number
    noShows: number
    cancelled: number
  }
}

export function AppointmentStats({ stats }: AppointmentStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{"Today's Summary"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Appointments</span>
          <span className="font-semibold">{stats.total}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Confirmed</span>
          <span className="font-semibold text-green-600">{stats.confirmed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Pending</span>
          <span className="font-semibold text-yellow-600">{stats.pending}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">No Shows</span>
          <span className="font-semibold text-red-600">{stats.noShows}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cancelled</span>
          <span className="font-semibold text-gray-600">{stats.cancelled}</span>
        </div>
      </CardContent>
    </Card>
  )
}
