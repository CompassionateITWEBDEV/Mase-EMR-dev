"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileSignature, Plus, Edit, Copy, Eye, Download, Search, AlertTriangle, Check, X } from "lucide-react"
import { mutate } from "swr"
import { useToast } from "@/hooks/use-toast"

interface FormTemplate {
  id: number
  name: string
  category: string
  description: string
  version: string
  isRequired: boolean
  lastModified: string
  status: string
  completionRate: number
}

interface FormTemplateManagerProps {
  data: {
    formTemplates: FormTemplate[]
  } | null
  isLoading: boolean
  error: Error | null
}

const categories = [
  "Health Screening",
  "Program Policies",
  "Treatment Consent",
  "Testing Procedures",
  "Medication Management",
  "Privacy & Information",
  "Media Release",
  "Assessment",
  "Patient Rights",
  "Telemedicine",
]

export function FormTemplateManager({ data, isLoading, error }: FormTemplateManagerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newForm, setNewForm] = useState({ name: "", category: "", description: "", isRequired: false })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [editForm, setEditForm] = useState({ name: "", category: "", description: "", isRequired: false })

  const { toast } = useToast()

  const formTemplates = data?.formTemplates || []

  const filteredTemplates = formTemplates.filter((template) => {
    const matchesSearch =
      template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleCreateTemplate = async () => {
    if (!newForm.name || !newForm.category) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/consent-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        setNewForm({ name: "", category: "", description: "", isRequired: false })
        mutate("/api/consent-forms")
        toast({
          title: "Template Created",
          description: "New consent form template has been created successfully.",
        })
      }
    } catch (err) {
      console.error("Error creating template:", err)
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreview = (template: FormTemplate) => {
    setSelectedTemplate(template)
    setPreviewDialogOpen(true)
  }

  const handleEdit = (template: FormTemplate) => {
    setSelectedTemplate(template)
    setEditForm({
      name: template.name,
      category: template.category,
      description: template.description || "",
      isRequired: template.isRequired,
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    setIsSubmitting(true)
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSubmitting(false)
    setEditDialogOpen(false)
    toast({
      title: "Template Updated",
      description: "Consent form template has been updated successfully.",
    })
    mutate("/api/consent-forms")
  }

  const handleDuplicate = (template: FormTemplate) => {
    setNewForm({
      name: `${template.name} (Copy)`,
      category: template.category,
      description: template.description || "",
      isRequired: template.isRequired,
    })
    setIsCreateDialogOpen(true)
    toast({
      title: "Template Duplicated",
      description: "Edit the duplicated template and save to create a new version.",
    })
  }

  const handleExport = (template: FormTemplate) => {
    const exportData = JSON.stringify(template, null, 2)
    const blob = new Blob([exportData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${template.name.replace(/\s+/g, "_")}_template.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Template Exported",
      description: `${template.name} has been exported as JSON.`,
    })
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Templates</h3>
          <p className="text-muted-foreground text-center">Failed to load form templates. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search form templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Form Template</DialogTitle>
              <DialogDescription>
                Create a new consent form template that can be assigned to patients.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Form Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter form name"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newForm.category}
                    onValueChange={(value) => setNewForm({ ...newForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter form description"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={newForm.isRequired}
                  onCheckedChange={(checked) => setNewForm({ ...newForm, isRequired: checked })}
                />
                <Label htmlFor="required">Required for all patients</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={isSubmitting || !newForm.name || !newForm.category}>
                {isSubmitting ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileSignature className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {formTemplates.length === 0
                ? "Create your first form template to get started."
                : "No form templates match your current search criteria."}
            </p>
            {formTemplates.length > 0 && (
              <Button
                onClick={() => {
                  setSearchTerm("")
                  setSelectedCategory("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description || "No description"}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {template.isRequired ? (
                      <Badge variant="destructive">Required</Badge>
                    ) : (
                      <Badge variant="secondary">Optional</Badge>
                    )}
                    <Badge variant="outline">v{template.version}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <span>Category: {template.category}</span>
                    <span>Modified: {new Date(template.lastModified).toLocaleDateString()}</span>
                    <span>Status: {template.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handlePreview(template)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport(template)}>
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>Preview of consent form template</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {selectedTemplate.isRequired ? (
                  <Badge variant="destructive">Required</Badge>
                ) : (
                  <Badge variant="secondary">Optional</Badge>
                )}
                <Badge variant="outline">v{selectedTemplate.version}</Badge>
                <Badge variant="outline">{selectedTemplate.category}</Badge>
              </div>

              <div className="border rounded-lg p-6 bg-white">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.description}</p>
                </div>

                <div className="space-y-4 text-sm">
                  <p>
                    I, the undersigned patient, hereby consent to and authorize the following as described in this form.
                    I understand that this consent is voluntary and that I may withdraw my consent at any time.
                  </p>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Terms and Conditions:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>I understand the purpose and nature of the services provided.</li>
                      <li>I have been informed of the potential risks and benefits.</li>
                      <li>I have had the opportunity to ask questions and have them answered.</li>
                      <li>I understand my rights as a patient under applicable laws and regulations.</li>
                    </ul>
                  </div>

                  <div className="border-t pt-4 mt-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Patient Signature</p>
                        <div className="border-b border-dashed h-8"></div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Date</p>
                        <div className="border-b border-dashed h-8"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                <span>Completion Rate: {selectedTemplate.completionRate}%</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Form Template</DialogTitle>
            <DialogDescription>Modify the consent form template settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Form Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-required"
                checked={editForm.isRequired}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isRequired: checked })}
              />
              <Label htmlFor="edit-required">Required for all patients</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting}>
              <Check className="h-4 w-4 mr-1" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
