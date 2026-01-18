import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck, AlertTriangle, Clock } from "lucide-react"

interface PatientStatsProps {
  stats: {
    total: number
    active: number
    highRisk: number
    recentAppointments: number
  }
}

export function PatientStats({ stats }: PatientStatsProps) {
  const statItems = [
    {
      title: "Total Patients",
      value: stats.total.toString(),
      icon: Users,
      change: "Active caseload",
      changeType: "neutral" as const,
    },
    {
      title: "Active Treatment",
      value: stats.active.toString(),
      icon: UserCheck,
      change: "In active care",
      changeType: "positive" as const,
    },
    {
      title: "High Risk",
      value: stats.highRisk.toString(),
      icon: AlertTriangle,
      change: "Require attention",
      changeType: "negative" as const,
    },
    {
      title: "Recent Activity",
      value: stats.recentAppointments.toString(),
      icon: Clock,
      change: "This week",
      changeType: "neutral" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-card-foreground font-[family-name:var(--font-work-sans)]">
                  {stat.value}
                </p>
                <p
                  className={`text-xs ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {stat.change}
                </p>
              </div>
              <stat.icon className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
