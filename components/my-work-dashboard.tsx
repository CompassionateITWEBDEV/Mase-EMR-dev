"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Clock, AlertTriangle, CheckCircle, FileText, Calendar, Eye, Target, Loader2 } from "lucide-react"

interface WorkTask {
  id: string
  task_name: string
  task_description: string
  status: string
  priority: string
  due_date: string
  estimated_duration_minutes: number
  assigned_to: string
  patient_id?: string
}

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
}

const statusColors: Record<string, string> = {
  pending: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  overdue: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
}

export function MyWorkDashboard() {
  const [tasks, setTasks] = useState<WorkTask[]>([])
  const [completedTasks, setCompletedTasks] = useState<WorkTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [sortBy, setSortBy] = useState("dueDate")

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/dashboard/work-queue")
        if (!response.ok) throw new Error("Failed to fetch work queue")

        const data = await response.json()
        setTasks(data.pendingTasks || [])
        setCompletedTasks(data.completedTasks || [])
      } catch (err) {
        console.error("Error loading work queue:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const pendingCount = tasks.filter((item) => item.status === "pending").length
  const overdueCount = tasks.filter((item) => {
    if (!item.due_date) return false
    return new Date(item.due_date) < new Date() && item.status !== "completed"
  }).length
  const inProgressCount = tasks.filter((item) => item.status === "in_progress").length
  const totalEstimatedTime = tasks.reduce((sum, item) => sum + (item.estimated_duration_minutes || 0), 0)

  const filteredItems = tasks.filter((item) => {
    const matchesSearch =
      (item.task_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (item.task_description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    const matchesPriority = selectedPriority === "all" || item.priority === selectedPriority
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus
    return matchesSearch && matchesPriority && matchesStatus
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "dueDate":
        return new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()
      case "priority":
        const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
        return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
      default:
        return 0
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressCount}</div>
            <p className="text-xs text-muted-foreground">Currently being worked on</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstimatedTime}m</div>
            <p className="text-xs text-muted-foreground">To complete all tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Work ({tasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {sortedItems.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending tasks. Your work queue is empty.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedItems.map((item) => {
                const isOverdue = item.due_date && new Date(item.due_date) < new Date()
                return (
                  <Card key={item.id} className={isOverdue ? "border-red-200 bg-red-50" : ""}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{item.task_name}</h3>
                            {item.priority && (
                              <Badge className={priorityColors[item.priority] || priorityColors.medium}>
                                {item.priority.toUpperCase()}
                              </Badge>
                            )}
                            <Badge className={statusColors[item.status] || statusColors.pending}>
                              {(item.status || "pending").replace("_", " ").toUpperCase()}
                            </Badge>
                          </div>
                          {item.task_description && (
                            <p className="text-sm text-muted-foreground">{item.task_description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            {item.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {item.estimated_duration_minutes && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{item.estimated_duration_minutes} min</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No completed tasks today.</CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedTasks.map((item) => (
                <Card key={item.id} className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.task_name}</h3>
                          <Badge className="bg-green-100 text-green-800">COMPLETED</Badge>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        {item.task_description && (
                          <p className="text-sm text-muted-foreground">{item.task_description}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
