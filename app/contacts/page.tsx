"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCircle,
  Briefcase,
  Hospital,
  Pill,
  Shield,
  FileText,
  Star,
  StarOff,
  MoreHorizontal,
  Download,
  Upload,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Contact {
  id: string
  name: string
  organization: string
  type: "provider" | "pharmacy" | "insurance" | "facility" | "laboratory" | "other"
  specialty?: string
  phone: string
  fax?: string
  email: string
  address: string
  city: string
  state: string
  zipCode: string
  npi?: string
  notes?: string
  isFavorite: boolean
  lastContacted?: string
  createdAt: string
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    organization: "City General Hospital",
    type: "provider",
    specialty: "Internal Medicine",
    phone: "(555) 123-4567",
    fax: "(555) 123-4568",
    email: "sjohnson@citygeneral.com",
    address: "123 Medical Center Dr",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90001",
    npi: "1234567890",
    isFavorite: true,
    lastContacted: "2026-01-10",
    createdAt: "2025-06-15",
  },
  {
    id: "2",
    name: "Metro Pharmacy",
    organization: "Metro Pharmacy Inc.",
    type: "pharmacy",
    phone: "(555) 234-5678",
    fax: "(555) 234-5679",
    email: "info@metropharmacy.com",
    address: "456 Main St",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90002",
    npi: "2345678901",
    isFavorite: true,
    lastContacted: "2026-01-12",
    createdAt: "2025-05-20",
  },
  {
    id: "3",
    name: "Blue Cross Provider Services",
    organization: "Blue Cross Blue Shield",
    type: "insurance",
    phone: "(800) 555-1234",
    email: "providers@bcbs.com",
    address: "789 Insurance Blvd",
    city: "Chicago",
    state: "IL",
    zipCode: "60601",
    isFavorite: false,
    createdAt: "2025-04-10",
  },
  {
    id: "4",
    name: "Valley Behavioral Health Center",
    organization: "Valley Health System",
    type: "facility",
    specialty: "Behavioral Health",
    phone: "(555) 345-6789",
    fax: "(555) 345-6790",
    email: "admissions@valleybh.org",
    address: "321 Recovery Way",
    city: "Pasadena",
    state: "CA",
    zipCode: "91101",
    npi: "3456789012",
    isFavorite: true,
    lastContacted: "2026-01-08",
    createdAt: "2025-07-01",
  },
  {
    id: "5",
    name: "LabCorp Patient Services",
    organization: "Laboratory Corporation of America",
    type: "laboratory",
    phone: "(800) 555-5678",
    fax: "(800) 555-5679",
    email: "providers@labcorp.com",
    address: "555 Lab Way",
    city: "Burlington",
    state: "NC",
    zipCode: "27215",
    isFavorite: false,
    lastContacted: "2026-01-05",
    createdAt: "2025-03-15",
  },
  {
    id: "6",
    name: "Dr. Michael Chen",
    organization: "Wellness Psychiatry Associates",
    type: "provider",
    specialty: "Psychiatry",
    phone: "(555) 456-7890",
    fax: "(555) 456-7891",
    email: "mchen@wellnesspsych.com",
    address: "222 Mental Health Ave",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    npi: "4567890123",
    isFavorite: true,
    lastContacted: "2026-01-11",
    createdAt: "2025-08-20",
  },
]

const contactTypeConfig = {
  provider: { icon: UserCircle, color: "bg-blue-100 text-blue-800", label: "Provider" },
  pharmacy: { icon: Pill, color: "bg-green-100 text-green-800", label: "Pharmacy" },
  insurance: { icon: Shield, color: "bg-purple-100 text-purple-800", label: "Insurance" },
  facility: { icon: Hospital, color: "bg-orange-100 text-orange-800", label: "Facility" },
  laboratory: { icon: FileText, color: "bg-cyan-100 text-cyan-800", label: "Laboratory" },
  other: { icon: Briefcase, color: "bg-gray-100 text-gray-800", label: "Other" },
}

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [contacts, setContacts] = useState<Contact[]>(mockContacts)
  const [addContactOpen, setAddContactOpen] = useState(false)
  const [editContactOpen, setEditContactOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const [contactForm, setContactForm] = useState({
    name: "",
    organization: "",
    type: "provider" as Contact["type"],
    specialty: "",
    phone: "",
    fax: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    npi: "",
    notes: "",
  })

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm)

    const matchesTab = activeTab === "all" || activeTab === "favorites" 
      ? (activeTab === "all" || contact.isFavorite) 
      : contact.type === activeTab

    return matchesSearch && matchesTab
  })

  const handleAddContact = () => {
    const newContact: Contact = {
      id: Date.now().toString(),
      ...contactForm,
      isFavorite: false,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setContacts([newContact, ...contacts])
    setAddContactOpen(false)
    resetForm()
    toast.success("Contact added successfully")
  }

  const handleEditContact = () => {
    if (!selectedContact) return
    setContacts(
      contacts.map((c) =>
        c.id === selectedContact.id ? { ...c, ...contactForm } : c
      )
    )
    setEditContactOpen(false)
    setSelectedContact(null)
    resetForm()
    toast.success("Contact updated successfully")
  }

  const handleDeleteContact = () => {
    if (!selectedContact) return
    setContacts(contacts.filter((c) => c.id !== selectedContact.id))
    setDeleteConfirmOpen(false)
    setSelectedContact(null)
    toast.success("Contact deleted successfully")
  }

  const handleToggleFavorite = (contactId: string) => {
    setContacts(
      contacts.map((c) =>
        c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
      )
    )
  }

  const openEditDialog = (contact: Contact) => {
    setSelectedContact(contact)
    setContactForm({
      name: contact.name,
      organization: contact.organization,
      type: contact.type,
      specialty: contact.specialty || "",
      phone: contact.phone,
      fax: contact.fax || "",
      email: contact.email,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      zipCode: contact.zipCode,
      npi: contact.npi || "",
      notes: contact.notes || "",
    })
    setEditContactOpen(true)
  }

  const resetForm = () => {
    setContactForm({
      name: "",
      organization: "",
      type: "provider",
      specialty: "",
      phone: "",
      fax: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      npi: "",
      notes: "",
    })
  }

  const stats = {
    total: contacts.length,
    providers: contacts.filter((c) => c.type === "provider").length,
    pharmacies: contacts.filter((c) => c.type === "pharmacy").length,
    insurance: contacts.filter((c) => c.type === "insurance").length,
    facilities: contacts.filter((c) => c.type === "facility").length,
    favorites: contacts.filter((c) => c.isFavorite).length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader
          title="Contacts"
          subtitle="Manage your provider network, pharmacies, and external contacts"
        />
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Providers</p>
                    <p className="text-2xl font-bold">{stats.providers}</p>
                  </div>
                  <UserCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pharmacies</p>
                    <p className="text-2xl font-bold">{stats.pharmacies}</p>
                  </div>
                  <Pill className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Insurance</p>
                    <p className="text-2xl font-bold">{stats.insurance}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Facilities</p>
                    <p className="text-2xl font-bold">{stats.facilities}</p>
                  </div>
                  <Hospital className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Favorites</p>
                    <p className="text-2xl font-bold">{stats.favorites}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Contact Directory</CardTitle>
                  <CardDescription>
                    Manage external providers, pharmacies, insurance contacts, and facilities
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => resetForm()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Contact</DialogTitle>
                        <DialogDescription>
                          Add a new contact to your directory
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Contact Name *</Label>
                            <Input
                              id="name"
                              placeholder="Dr. John Smith"
                              value={contactForm.name}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, name: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="organization">Organization *</Label>
                            <Input
                              id="organization"
                              placeholder="City Hospital"
                              value={contactForm.organization}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, organization: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="type">Contact Type *</Label>
                            <Select
                              value={contactForm.type}
                              onValueChange={(value: Contact["type"]) =>
                                setContactForm({ ...contactForm, type: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="provider">Provider</SelectItem>
                                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                                <SelectItem value="insurance">Insurance</SelectItem>
                                <SelectItem value="facility">Facility</SelectItem>
                                <SelectItem value="laboratory">Laboratory</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="specialty">Specialty</Label>
                            <Input
                              id="specialty"
                              placeholder="Internal Medicine"
                              value={contactForm.specialty}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, specialty: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone *</Label>
                            <Input
                              id="phone"
                              placeholder="(555) 123-4567"
                              value={contactForm.phone}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, phone: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fax">Fax</Label>
                            <Input
                              id="fax"
                              placeholder="(555) 123-4568"
                              value={contactForm.fax}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, fax: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="contact@example.com"
                              value={contactForm.email}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, email: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="npi">NPI Number</Label>
                            <Input
                              id="npi"
                              placeholder="1234567890"
                              value={contactForm.npi}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, npi: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Street Address</Label>
                          <Input
                            id="address"
                            placeholder="123 Medical Center Dr"
                            value={contactForm.address}
                            onChange={(e) =>
                              setContactForm({ ...contactForm, address: e.target.value })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              placeholder="Los Angeles"
                              value={contactForm.city}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, city: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              placeholder="CA"
                              value={contactForm.state}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, state: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zipCode">ZIP Code</Label>
                            <Input
                              id="zipCode"
                              placeholder="90001"
                              value={contactForm.zipCode}
                              onChange={(e) =>
                                setContactForm({ ...contactForm, zipCode: e.target.value })
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            placeholder="Additional notes about this contact..."
                            value={contactForm.notes}
                            onChange={(e) =>
                              setContactForm({ ...contactForm, notes: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddContactOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddContact}
                          disabled={!contactForm.name || !contactForm.phone || !contactForm.email}
                        >
                          Add Contact
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, organization, email, or phone..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="all">All ({contacts.length})</TabsTrigger>
                  <TabsTrigger value="favorites">
                    <Star className="h-4 w-4 mr-1" />
                    Favorites ({stats.favorites})
                  </TabsTrigger>
                  <TabsTrigger value="provider">Providers ({stats.providers})</TabsTrigger>
                  <TabsTrigger value="pharmacy">Pharmacies ({stats.pharmacies})</TabsTrigger>
                  <TabsTrigger value="insurance">Insurance ({stats.insurance})</TabsTrigger>
                  <TabsTrigger value="facility">Facilities ({stats.facilities})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="hidden md:table-cell">Phone</TableHead>
                          <TableHead className="hidden lg:table-cell">Email</TableHead>
                          <TableHead className="hidden xl:table-cell">Location</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContacts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              No contacts found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredContacts.map((contact) => {
                            const typeConfig = contactTypeConfig[contact.type]
                            const TypeIcon = typeConfig.icon
                            return (
                              <TableRow key={contact.id}>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleFavorite(contact.id)}
                                  >
                                    {contact.isFavorite ? (
                                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    ) : (
                                      <StarOff className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                      <TypeIcon className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{contact.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {contact.organization}
                                      </div>
                                      {contact.specialty && (
                                        <div className="text-xs text-muted-foreground">
                                          {contact.specialty}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={typeConfig.color} variant="secondary">
                                    {typeConfig.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">{contact.phone}</span>
                                  </div>
                                  {contact.fax && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Fax: {contact.fax}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm truncate max-w-[200px]">
                                      {contact.email}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden xl:table-cell">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-sm">
                                      {contact.city}, {contact.state}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleToggleFavorite(contact.id)}
                                      >
                                        {contact.isFavorite ? (
                                          <>
                                            <StarOff className="h-4 w-4 mr-2" />
                                            Remove from Favorites
                                          </>
                                        ) : (
                                          <>
                                            <Star className="h-4 w-4 mr-2" />
                                            Add to Favorites
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          setSelectedContact(contact)
                                          setDeleteConfirmOpen(true)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Edit Contact Dialog */}
          <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Contact</DialogTitle>
                <DialogDescription>
                  Update contact information
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Contact Name *</Label>
                    <Input
                      id="edit-name"
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-organization">Organization *</Label>
                    <Input
                      id="edit-organization"
                      value={contactForm.organization}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, organization: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Contact Type *</Label>
                    <Select
                      value={contactForm.type}
                      onValueChange={(value: Contact["type"]) =>
                        setContactForm({ ...contactForm, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="provider">Provider</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="facility">Facility</SelectItem>
                        <SelectItem value="laboratory">Laboratory</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-specialty">Specialty</Label>
                    <Input
                      id="edit-specialty"
                      value={contactForm.specialty}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, specialty: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone *</Label>
                    <Input
                      id="edit-phone"
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-fax">Fax</Label>
                    <Input
                      id="edit-fax"
                      value={contactForm.fax}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, fax: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-npi">NPI Number</Label>
                    <Input
                      id="edit-npi"
                      value={contactForm.npi}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, npi: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Street Address</Label>
                  <Input
                    id="edit-address"
                    value={contactForm.address}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, address: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-city">City</Label>
                    <Input
                      id="edit-city"
                      value={contactForm.city}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, city: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-state">State</Label>
                    <Input
                      id="edit-state"
                      value={contactForm.state}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, state: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-zipCode">ZIP Code</Label>
                    <Input
                      id="edit-zipCode"
                      value={contactForm.zipCode}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, zipCode: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={contactForm.notes}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditContactOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditContact}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Contact</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {selectedContact?.name}? This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteContact}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
