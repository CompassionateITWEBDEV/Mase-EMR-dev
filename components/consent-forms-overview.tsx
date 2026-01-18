"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileSignature, AlertTriangle, Eye, Edit, Users, TrendingUp, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface FormItem {
  id: number
  name: string
  required: boolean
  completion: number
}

interface ConsentFormsOverviewProps {
  data: {
    categorizedForms: Record<string, FormItem[]>
    metrics: {
      totalForms: number
      totalPatients: number
      overallCompletionRate: number
    }
  } | null
  isLoading: boolean
  error: Error | null
}

export function ConsentFormsOverview({ data, isLoading, error }: ConsentFormsOverviewProps) {
  const [selectedForm, setSelectedForm] = useState<FormItem | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", required: false })

  const handleView = (form: FormItem) => {
    setSelectedForm(form)
    setViewDialogOpen(true)
  }

  const handleEdit = (form: FormItem) => {
    setSelectedForm(form)
    setEditForm({ name: form.name, required: form.required })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    // Save edit logic here
    setEditDialogOpen(false)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground text-center">Failed to load consent forms data. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const categorizedForms = data?.categorizedForms || {}
  const metrics = data?.metrics || { totalForms: 0, totalPatients: 0, overallCompletionRate: 0 }

  const totalForms = Object.values(categorizedForms).reduce((acc, forms) => acc + forms.length, 0)
  const requiredForms = Object.values(categorizedForms).reduce(
    (acc, forms) => acc + forms.filter((form) => form.required).length,
    0,
  )

  if (totalForms === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileSignature className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Form Templates Found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first consent form template to get started.
          </p>
          <Button>
            <FileSignature className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overallCompletionRate}%</div>
            <Progress value={metrics.overallCompletionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Average across all forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Required Forms</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requiredForms}</div>
            <p className="text-xs text-muted-foreground">of {totalForms} total forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Requiring consent tracking</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {Object.entries(categorizedForms).map(([category, forms]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
              <CardDescription>
                {forms.length} form{forms.length !== 1 ? "s" : ""} in this category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forms.map((form) => (
                  <div key={form.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileSignature className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{form.name}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          {form.required ? (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Optional
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">{form.completion}% completion</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={form.completion} className="w-24" />
                      <Button variant="outline" size="sm" onClick={() => handleView(form)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(form)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedForm?.name}</DialogTitle>
            <DialogDescription>Consent form details and completion status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Form Name</Label>
                <p className="text-sm font-medium">{selectedForm?.name}</p>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div>
                  {selectedForm?.required ? (
                    <Badge variant="destructive">Required</Badge>
                  ) : (
                    <Badge variant="secondary">Optional</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Completion Rate</Label>
              <div className="flex items-center space-x-4">
                <Progress value={selectedForm?.completion || 0} className="flex-1" />
                <span className="text-lg font-bold">{selectedForm?.completion}%</span>
              </div>
            </div>
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Form Content Preview</h4>
              <p className="text-sm text-muted-foreground">
                This consent form collects patient authorization for treatment and information disclosure in accordance
                with HIPAA and applicable state regulations. The patient acknowledges understanding of their rights and
                responsibilities.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              <span>Compliant with regulatory requirements</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Consent Form</DialogTitle>
            <DialogDescription>Modify the consent form settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Form Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-required"
                checked={editForm.required}
                onCheckedChange={(checked) => setEditForm({ ...editForm, required: checked })}
              />
              <Label htmlFor="edit-required">Required for all patients</Label>
            </div>
            <div className="space-y-2">
              <Label>Form Content</Label>
              <Textarea placeholder="Enter form content or instructions..." className="min-h-[150px]" />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Check className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
