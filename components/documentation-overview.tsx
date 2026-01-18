import { Card, CardContent } from "@/components/ui/card"
import { FileText, ClipboardList, AlertCircle, CheckCircle } from "lucide-react"

interface DocumentationOverviewProps {
  stats: {
    assessments: number
    progressNotes: number
    total: number
    pending: number
  }
}

export function DocumentationOverview({ stats }: DocumentationOverviewProps) {
  const overviewItems = [
    {
      title: "Total Documents",
      value: stats.total.toString(),
      icon: FileText,
      change: "All clinical documents",
      changeType: "neutral" as const,
    },
    {
      title: "Assessments",
      value: stats.assessments.toString(),
      icon: ClipboardList,
      change: "Clinical assessments",
      changeType: "positive" as const,
    },
    {
      title: "Progress Notes",
      value: stats.progressNotes.toString(),
      icon: CheckCircle,
      change: "Treatment progress",
      changeType: "positive" as const,
    },
    {
      title: "Pending Review",
      value: stats.pending.toString(),
      icon: AlertCircle,
      change: "Awaiting completion",
      changeType: "negative" as const,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {overviewItems.map((item) => (
        <Card key={item.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                <p className="text-2xl font-bold text-card-foreground font-[family-name:var(--font-work-sans)]">
                  {item.value}
                </p>
                <p
                  className={`text-xs ${
                    item.changeType === "positive"
                      ? "text-green-600"
                      : item.changeType === "negative"
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {item.change}
                </p>
              </div>
              <item.icon className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
