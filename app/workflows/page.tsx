"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  Play,
  Pause,
  RotateCcw,
  Loader2,
} from "lucide-react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface WorkflowTask {
  id: string
  task_name: string
  task_description: string
  assigned_to: string
  assigned_staff?: { id: string; first_name: string; last_name: string }
  due_date: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  assigned_role: string
  workflow_instance_id?: string
  workflow?: { id: string; patient_id: string; status: string }
  created_at: string
  completed_at?: string
  notes?: string
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  priority: string
  is_active: boolean
  estimated_duration_minutes: number
  created_at: string
}

interface WorkflowInstance {
  id: string
  status: string
  priority: string
  started_at: string
  due_date: string
  template?: WorkflowTemplate
  patient?: { id: string; first_name: string; last_name: string }
  started_by_staff?: { id: string; first_name: string; last_name: string }
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  role: string
}

interface Patient {
  id: string
  first_name: string
  last_name: string
}

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState("tasks")
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const [showNewWorkflowDialog, setShowNewWorkflowDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const [newTask, setNewTask] = useState({
    task_name: "",
    task_description: "",
    assigned_to: "",
    assigned_role: "",
    due_date: "",
    priority: "medium" as const,
  })

  const [newWorkflow, setNewWorkflow] = useState({
    workflow_template_id: "",
    patient_id: "",
    priority: "medium",
    notes: "",
  })

  // Fetch data from APIs
  const { data: tasksData, error: tasksError, mutate: mutateTasks } = useSWR("/api/workflows/tasks", fetcher)
  const { data: workflowsData, error: workflowsError, mutate: mutateWorkflows } = useSWR("/api/workflows", fetcher)
  const { data: templatesData } = useSWR("/api/workflows/templates", fetcher)
  const { data: staffData } = useSWR("/api/staff", fetcher)
  const { data: patientsData } = useSWR("/api/patients", fetcher)

  const tasks: WorkflowTask[] = tasksData?.tasks || []
  const workflows: WorkflowInstance[] = workflowsData?.workflows || []
  const templates: WorkflowTemplate[] = templatesData?.templates || []
  const staffList: Staff[] = staffData?.staff || []
  const patientsList: Patient[] = patientsData?.patients || []

  const handleCreateTask = async () => {
    if (!newTask.task_name || !newTask.assigned_to) {
      toast.error("Please fill in required fields")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/workflows/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTask,
          status: "pending",
        }),
      })

      if (response.ok) {
        toast.success("Task created successfully")
        mutateTasks()
        setShowNewTaskDialog(false)
        setNewTask({
          task_name: "",
          task_description: "",
          assigned_to: "",
          assigned_role: "",
          due_date: "",
          priority: "medium",
        })
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to create task")
      }
    } catch (error) {
      console.error("Failed to create task:", error)
      toast.error("Failed to create task")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.workflow_template_id) {
      toast.error("Please select a workflow template")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newWorkflow,
          status: "pending",
          started_at: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        toast.success("Workflow started successfully")
        mutateWorkflows()
        setShowNewWorkflowDialog(false)
        setNewWorkflow({
          workflow_template_id: "",
          patient_id: "",
          priority: "medium",
          notes: "",
        })
      } else {
        const data = await response.json()
        toast.error(data.error || "Failed to start workflow")
      }
    } catch (error) {
      console.error("Failed to start workflow:", error)
      toast.error("Failed to start workflow")
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/workflows/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast.success(`Task ${status === "completed" ? "completed" : "updated"}`)
        mutateTasks()
      } else {
        toast.error("Failed to update task")
      }
    } catch (error) {
      console.error("Failed to update task status:", error)
      toast.error("Failed to update task")
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "in_progress":
        return <Play className="w-4 h-4" />
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "cancelled":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "in_progress":
        return "default"
      case "completed":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (activeTab === "overdue") {
      return task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed"
    }
    if (activeTab === "completed") {
      return task.status === "completed"
    }
    if (activeTab === "in-progress") {
      return task.status === "in_progress"
    }
    return true
  })

  const isLoading = !tasksData && !tasksError

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Staff Workflows</h1>
              <p className="text-muted-foreground">Manage tasks, workflows, and staff assignments</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={showNewWorkflowDialog} onOpenChange={setShowNewWorkflowDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Workflow
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Start New Workflow</DialogTitle>
                    <DialogDescription>Select a workflow template and assign it to a patient</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Workflow Template</Label>
                      <Select
                        value={newWorkflow.workflow_template_id}
                        onValueChange={(value) => setNewWorkflow((prev) => ({ ...prev, workflow_template_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.length > 0 ? (
                            templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="intake">Patient Intake</SelectItem>
                              <SelectItem value="medication-review">Medication Review</SelectItem>
                              <SelectItem value="compliance-check">Compliance Check</SelectItem>
                              <SelectItem value="assessment">Assessment</SelectItem>
                              <SelectItem value="discharge">Discharge Planning</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Patient (Optional)</Label>
                      <Select
                        value={newWorkflow.patient_id}
                        onValueChange={(value) => setNewWorkflow((prev) => ({ ...prev, patient_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No patient</SelectItem>
                          {patientsList.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.first_name} {patient.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={newWorkflow.priority}
                        onValueChange={(value) => setNewWorkflow((prev) => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={newWorkflow.notes}
                        onChange={(e) => setNewWorkflow((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Add any notes..."
                        rows={2}
                      />
                    </div>

                    <Button onClick={handleCreateWorkflow} className="w-full" disabled={isCreating}>
                      {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Start Workflow
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Assign a new task to a staff member</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="task-name">Task Name</Label>
                      <Input
                        id="task-name"
                        value={newTask.task_name}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, task_name: e.target.value }))}
                        placeholder="Enter task name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        value={newTask.task_description}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, task_description: e.target.value }))}
                        placeholder="Describe the task requirements..."
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Assign To</Label>
                        <Select
                          value={newTask.assigned_to}
                          onValueChange={(value) => setNewTask((prev) => ({ ...prev, assigned_to: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select staff" />
                          </SelectTrigger>
                          <SelectContent>
                            {staffList.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.first_name} {staff.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Priority</Label>
                        <Select
                          value={newTask.priority}
                          onValueChange={(value: any) => setNewTask((prev) => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Due Date</Label>
                        <Input
                          type="datetime-local"
                          value={newTask.due_date}
                          onChange={(e) => setNewTask((prev) => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label>Role</Label>
                        <Select
                          value={newTask.assigned_role}
                          onValueChange={(value) => setNewTask((prev) => ({ ...prev, assigned_role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nurse">Nurse</SelectItem>
                            <SelectItem value="physician">Physician</SelectItem>
                            <SelectItem value="counselor">Counselor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="pharmacist">Pharmacist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button onClick={handleCreateTask} className="w-full" disabled={isCreating}>
                      {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Create Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="tasks">All Tasks</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {activeTab !== "workflows" ? (
                <div className="grid gap-4">
                  {isLoading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </CardContent>
                    </Card>
                  ) : filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <Card
                        key={task.id}
                        className={
                          task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed"
                            ? "border-red-200 bg-red-50"
                            : ""
                        }
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                {task.task_name}
                              </CardTitle>
                              <CardDescription>
                                <User className="w-4 h-4 inline mr-1" />
                                Assigned to{" "}
                                {task.assigned_staff
                                  ? `${task.assigned_staff.first_name} ${task.assigned_staff.last_name}`
                                  : task.assigned_role || "Unassigned"}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                              <Badge variant={getStatusBadgeVariant(task.status)} className="flex items-center gap-1">
                                {getStatusIcon(task.status)}
                                {task.status.replace("_", " ")}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {task.task_description && (
                              <p className="text-sm text-muted-foreground">{task.task_description}</p>
                            )}

                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-4">
                                {task.due_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Due: {new Date(task.due_date).toLocaleString()}
                                  </div>
                                )}
                                {task.assigned_role && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="w-4 h-4" />
                                    Role: {task.assigned_role}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Created: {new Date(task.created_at).toLocaleDateString()}
                              </div>
                            </div>

                            {task.notes && (
                              <div className="p-3 bg-muted rounded-lg">
                                <div className="text-sm font-medium mb-1">Notes</div>
                                <div className="text-sm text-muted-foreground">{task.notes}</div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {task.status === "pending" && (
                                <Button size="sm" onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}>
                                  <Play className="w-4 h-4 mr-2" />
                                  Start Task
                                </Button>
                              )}
                              {task.status === "in_progress" && (
                                <>
                                  <Button size="sm" onClick={() => handleUpdateTaskStatus(task.id, "completed")}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Complete
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateTaskStatus(task.id, "pending")}
                                  >
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                  </Button>
                                </>
                              )}
                              {task.status !== "completed" &&
                                task.status !== "in_progress" &&
                                task.status !== "pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateTaskStatus(task.id, "in_progress")}
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Resume
                                  </Button>
                                )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No tasks found</p>
                        <Button
                          variant="outline"
                          className="mt-4 bg-transparent"
                          onClick={() => setShowNewTaskDialog(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Task
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {workflows.length > 0 ? (
                    workflows.map((workflow) => (
                      <Card key={workflow.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                {workflow.template?.name || "Workflow"}
                              </CardTitle>
                              <CardDescription>
                                {workflow.patient
                                  ? `Patient: ${workflow.patient.first_name} ${workflow.patient.last_name}`
                                  : workflow.template?.description || "No description"}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={workflow.status === "completed" ? "default" : "secondary"}>
                                {workflow.status}
                              </Badge>
                              <Badge variant={getPriorityBadgeVariant(workflow.priority)}>{workflow.priority}</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Started: {new Date(workflow.started_at).toLocaleDateString()}
                              </div>
                              {workflow.due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Due: {new Date(workflow.due_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            {workflow.started_by_staff && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                By: {workflow.started_by_staff.first_name} {workflow.started_by_staff.last_name}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No workflows found</p>
                        <Button
                          variant="outline"
                          className="mt-4 bg-transparent"
                          onClick={() => setShowNewWorkflowDialog(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Start First Workflow
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
