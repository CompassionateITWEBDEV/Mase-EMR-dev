"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Loader2,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react"
import { getRoleDisplayName, type StaffRole } from "@/lib/auth/roles"
import {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  type StaffMember,
  type CreateStaffInput,
} from "./actions"
import { useToast } from "@/hooks/use-toast"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

async function fetchStaff() {
  const result = await getStaffMembers()
  if (result.error) throw new Error(result.error)
  return result.data || []
}

export default function StaffManagement() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newStaff, setNewStaff] = useState<CreateStaffInput>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "general_staff",
    department: "",
    license_type: "",
    license_number: "",
  })
  const [sendInvite, setSendInvite] = useState(true)

  const {
    data: staffMembers = [],
    error,
    isLoading,
    mutate,
  } = useSWR<StaffMember[]>("staff-members", fetchStaff, {
    revalidateOnFocus: false,
  })

  const filteredStaff = staffMembers.filter((staff) => {
    const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) || staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || staff.role === selectedRole
    const matchesDepartment = selectedDepartment === "all" || staff.department === selectedDepartment

    return matchesSearch && matchesRole && matchesDepartment
  })

  const departments = [...new Set(staffMembers.map((s) => s.department).filter(Boolean))]

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <AlertCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    )
  }

  const getRoleBadge = (role: StaffRole) => {
    const roleColors: Record<string, string> = {
      super_admin: "bg-purple-100 text-purple-800",
      admin: "bg-blue-100 text-blue-800",
      doctor: "bg-green-100 text-green-800",
      rn: "bg-teal-100 text-teal-800",
      lpn: "bg-cyan-100 text-cyan-800",
      dispensing_nurse: "bg-orange-100 text-orange-800",
      pharmacist: "bg-indigo-100 text-indigo-800",
      counselor: "bg-pink-100 text-pink-800",
      case_manager: "bg-yellow-100 text-yellow-800",
      supervisor: "bg-red-100 text-red-800",
    }
    return <Badge className={roleColors[role] || ""}>{getRoleDisplayName(role)}</Badge>
  }

  const handleCreateStaff = async () => {
    if (!newStaff.first_name || !newStaff.last_name || !newStaff.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createStaffMember(newStaff)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: `${newStaff.first_name} ${newStaff.last_name} has been added to the staff.`,
      })

      setNewStaff({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "general_staff",
        department: "",
        license_type: "",
        license_number: "",
      })
      setSendInvite(true)
      setIsAddStaffOpen(false)
      mutate()
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateStaff = async () => {
    if (!selectedStaff) return

    setIsSubmitting(true)
    try {
      const result = await updateStaffMember(selectedStaff.id, {
        first_name: selectedStaff.first_name,
        last_name: selectedStaff.last_name,
        email: selectedStaff.email,
        phone: selectedStaff.phone,
        role: selectedStaff.role,
        department: selectedStaff.department,
        license_type: selectedStaff.license_type,
        license_number: selectedStaff.license_number,
        is_active: selectedStaff.is_active,
      })

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
        return
      }

      toast({ title: "Success", description: "Staff member updated successfully." })
      setIsEditOpen(false)
      mutate()
    } catch (err) {
      toast({ title: "Error", description: "Failed to update staff member.", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStaff = async (staff: StaffMember) => {
    if (!confirm(`Are you sure you want to deactivate ${staff.first_name} ${staff.last_name}?`)) return

    try {
      const result = await deleteStaffMember(staff.id)
      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
        return
      }
      toast({ title: "Success", description: "Staff member deactivated." })
      mutate()
    } catch (err) {
      toast({ title: "Error", description: "Failed to deactivate staff member.", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Staff Management</h1>
              <p className="text-muted-foreground">Manage staff members, roles, and permissions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => mutate()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Staff Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                    <DialogDescription>
                      Create a new staff account with appropriate role and permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        placeholder="Enter first name"
                        value={newStaff.first_name}
                        onChange={(e) => setNewStaff((prev) => ({ ...prev, first_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        placeholder="Enter last name"
                        value={newStaff.last_name}
                        onChange={(e) => setNewStaff((prev) => ({ ...prev, last_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={newStaff.email}
                        onChange={(e) => setNewStaff((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="Enter phone number"
                        value={newStaff.phone || ""}
                        onChange={(e) => setNewStaff((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={newStaff.role}
                        onValueChange={(value) => setNewStaff((prev) => ({ ...prev, role: value as StaffRole }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Administrator</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="doctor">Doctor/Physician</SelectItem>
                          <SelectItem value="rn">Registered Nurse (RN)</SelectItem>
                          <SelectItem value="lpn">Licensed Practical Nurse (LPN)</SelectItem>
                          <SelectItem value="dispensing_nurse">Dispensing Nurse</SelectItem>
                          <SelectItem value="pharmacist">Pharmacist</SelectItem>
                          <SelectItem value="counselor">Counselor</SelectItem>
                          <SelectItem value="case_manager">Case Manager</SelectItem>
                          <SelectItem value="peer_recovery">Peer Recovery Specialist</SelectItem>
                          <SelectItem value="medical_assistant">Medical Assistant</SelectItem>
                          <SelectItem value="intake">Intake Specialist</SelectItem>
                          <SelectItem value="front_desk">Front Desk</SelectItem>
                          <SelectItem value="billing">Billing Specialist</SelectItem>
                          <SelectItem value="supervisor">Clinical Supervisor</SelectItem>
                          <SelectItem value="general_staff">General Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={newStaff.department || "none"}
                        onValueChange={(value) =>
                          setNewStaff((prev) => ({ ...prev, department: value === "none" ? "" : value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Department</SelectItem>
                          <SelectItem value="Administration">Administration</SelectItem>
                          <SelectItem value="Medical">Medical</SelectItem>
                          <SelectItem value="Nursing">Nursing</SelectItem>
                          <SelectItem value="Dispensing">Dispensing</SelectItem>
                          <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                          <SelectItem value="Behavioral Health">Behavioral Health</SelectItem>
                          <SelectItem value="Counseling">Counseling</SelectItem>
                          <SelectItem value="Case Management">Case Management</SelectItem>
                          <SelectItem value="Peer Support">Peer Support</SelectItem>
                          <SelectItem value="Intake">Intake</SelectItem>
                          <SelectItem value="Front Office">Front Office</SelectItem>
                          <SelectItem value="Billing">Billing</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Compliance">Compliance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license_type">License Type</Label>
                      <Select
                        value={newStaff.license_type || "none"}
                        onValueChange={(value) =>
                          setNewStaff((prev) => ({ ...prev, license_type: value === "none" ? "" : value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select license type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No License</SelectItem>
                          <SelectItem value="MD">Doctor of Medicine (MD)</SelectItem>
                          <SelectItem value="DO">Doctor of Osteopathy (DO)</SelectItem>
                          <SelectItem value="NP">Nurse Practitioner (NP)</SelectItem>
                          <SelectItem value="PA">Physician Assistant (PA)</SelectItem>
                          <SelectItem value="RN">Registered Nurse (RN)</SelectItem>
                          <SelectItem value="LPN">Licensed Practical Nurse (LPN)</SelectItem>
                          <SelectItem value="PharmD">Doctor of Pharmacy (PharmD)</SelectItem>
                          <SelectItem value="RPh">Registered Pharmacist (RPh)</SelectItem>
                          <SelectItem value="LCSW">Licensed Clinical Social Worker (LCSW)</SelectItem>
                          <SelectItem value="LMSW">Licensed Master Social Worker (LMSW)</SelectItem>
                          <SelectItem value="LPC">Licensed Professional Counselor (LPC)</SelectItem>
                          <SelectItem value="LPCC">Licensed Professional Clinical Counselor (LPCC)</SelectItem>
                          <SelectItem value="LCDC">Licensed Chemical Dependency Counselor (LCDC)</SelectItem>
                          <SelectItem value="CADC">Certified Alcohol and Drug Counselor (CADC)</SelectItem>
                          <SelectItem value="CPS">Certified Peer Specialist (CPS)</SelectItem>
                          <SelectItem value="CPRS">Certified Peer Recovery Specialist (CPRS)</SelectItem>
                          <SelectItem value="CMA">Certified Medical Assistant (CMA)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="license_number">License Number</Label>
                      <Input
                        id="license_number"
                        placeholder="Enter license number"
                        value={newStaff.license_number || ""}
                        onChange={(e) => setNewStaff((prev) => ({ ...prev, license_number: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2 flex items-center space-x-2">
                      <Switch id="send-invite" checked={sendInvite} onCheckedChange={setSendInvite} />
                      <Label htmlFor="send-invite">Send invitation email</Label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddStaffOpen(false)} disabled={isSubmitting}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateStaff} disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Staff Member
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Directory
              </CardTitle>
              <CardDescription>View and manage all staff members across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Administrator</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="rn">Registered Nurse</SelectItem>
                    <SelectItem value="lpn">LPN</SelectItem>
                    <SelectItem value="dispensing_nurse">Dispensing Nurse</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="counselor">Counselor</SelectItem>
                    <SelectItem value="case_manager">Case Manager</SelectItem>
                    <SelectItem value="peer_recovery">Peer Recovery</SelectItem>
                    <SelectItem value="medical_assistant">Medical Assistant</SelectItem>
                    <SelectItem value="intake">Intake Specialist</SelectItem>
                    <SelectItem value="front_desk">Front Desk</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="general_staff">General Staff</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept} value={dept!}>
                          {dept}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Medical">Medical</SelectItem>
                        <SelectItem value="Nursing">Nursing</SelectItem>
                        <SelectItem value="Dispensing">Dispensing</SelectItem>
                        <SelectItem value="Behavioral Health">Behavioral Health</SelectItem>
                        <SelectItem value="Peer Support">Peer Support</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading staff members...</span>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error Loading Staff</h3>
                  <p className="text-muted-foreground mb-4">{error.message}</p>
                  <Button variant="outline" onClick={() => mutate()}>
                    Try Again
                  </Button>
                </div>
              )}

              {!isLoading && !error && (
                <div className="space-y-4">
                  {filteredStaff.map((staff) => (
                    <Card key={staff.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src="/placeholder.svg" alt={`${staff.first_name} ${staff.last_name}`} />
                            <AvatarFallback>
                              {staff.first_name[0]}
                              {staff.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">
                              {staff.first_name} {staff.last_name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {staff.email}
                              {staff.phone && (
                                <>
                                  <Phone className="h-3 w-3 ml-2" />
                                  {staff.phone}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {getRoleBadge(staff.role)}
                              {staff.department && <Badge variant="secondary">{staff.department}</Badge>}
                              {getStatusBadge(staff.is_active)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right text-sm text-muted-foreground">
                            {staff.hire_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Hired: {new Date(staff.hire_date).toLocaleDateString()}
                              </div>
                            )}
                            {staff.license_type && (
                              <div className="mt-1">
                                License: {staff.license_type} {staff.license_number && `#${staff.license_number}`}
                              </div>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedStaff(staff)
                                  setIsViewOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedStaff(staff)
                                  setIsEditOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteStaff(staff)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {!isLoading && !error && filteredStaff.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No staff members found</h3>
                  <p className="text-muted-foreground">
                    {staffMembers.length === 0
                      ? "Add your first staff member to get started."
                      : "Try adjusting your search criteria."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {selectedStaff.first_name[0]}
                    {selectedStaff.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedStaff.first_name} {selectedStaff.last_name}
                  </h3>
                  {getRoleBadge(selectedStaff.role)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span> {selectedStaff.email}
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span> {selectedStaff.phone || "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">Department:</span> {selectedStaff.department || "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {selectedStaff.is_active ? "Active" : "Inactive"}
                </div>
                <div>
                  <span className="text-muted-foreground">License Type:</span> {selectedStaff.license_type || "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">License #:</span> {selectedStaff.license_number || "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">Hire Date:</span>{" "}
                  {selectedStaff.hire_date ? new Date(selectedStaff.hire_date).toLocaleDateString() : "N/A"}
                </div>
                <div>
                  <span className="text-muted-foreground">Employee ID:</span> {selectedStaff.employee_id || "N/A"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={selectedStaff.first_name}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={selectedStaff.last_name}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={selectedStaff.email}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={selectedStaff.phone || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedStaff.role}
                  onValueChange={(value) => setSelectedStaff({ ...selectedStaff, role: value as StaffRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Administrator</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="rn">Registered Nurse</SelectItem>
                    <SelectItem value="lpn">LPN</SelectItem>
                    <SelectItem value="dispensing_nurse">Dispensing Nurse</SelectItem>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="counselor">Counselor</SelectItem>
                    <SelectItem value="case_manager">Case Manager</SelectItem>
                    <SelectItem value="peer_recovery">Peer Recovery</SelectItem>
                    <SelectItem value="medical_assistant">Medical Assistant</SelectItem>
                    <SelectItem value="intake">Intake Specialist</SelectItem>
                    <SelectItem value="front_desk">Front Desk</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="general_staff">General Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={selectedStaff.department || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>License Type</Label>
                <Input
                  value={selectedStaff.license_type || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, license_type: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input
                  value={selectedStaff.license_number || ""}
                  onChange={(e) => setSelectedStaff({ ...selectedStaff, license_number: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <Switch
                  checked={selectedStaff.is_active}
                  onCheckedChange={(checked) => setSelectedStaff({ ...selectedStaff, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStaff} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
