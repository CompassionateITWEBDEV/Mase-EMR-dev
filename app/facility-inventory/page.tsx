"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Package,
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
  TrendingDown,
  Calendar,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function FacilityInventoryPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockAlerts: 0,
    expiringSoon: 0,
    categories: 0,
    lowStockItems: [] as any[],
  })
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [newItemOpen, setNewItemOpen] = useState(false)
  const [editItemOpen, setEditItemOpen] = useState(false)
  const [deleteItemOpen, setDeleteItemOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  const [itemForm, setItemForm] = useState({
    item_name: "",
    category: "medical",
    quantity: 0,
    unit_of_measure: "",
    reorder_level: 10,
    expiration_date: "",
    lot_number: "",
    storage_location: "",
    notes: "",
  })

  useEffect(() => {
    loadInventory()
  }, [selectedCategory])

  const loadInventory = async () => {
    setLoading(true)
    try {
      const url = selectedCategory !== "all" ? `/api/facility-inventory?category=${selectedCategory}` : "/api/facility-inventory"
      const response = await fetch(url)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setInventory(data.inventory || [])
      setStats(data.stats || stats)
    } catch (error: any) {
      console.error("Error loading inventory:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load inventory",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateItem = async () => {
    if (!itemForm.item_name || !itemForm.category || !itemForm.unit_of_measure) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Item Name, Category, Unit of Measure)",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/facility-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemForm),
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: "Inventory item added successfully",
      })
      setNewItemOpen(false)
      resetForm()
      loadInventory()
    } catch (error: any) {
      console.error("Error creating item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!selectedItem || !itemForm.item_name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/facility-inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          ...itemForm,
        }),
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      })
      setEditItemOpen(false)
      setSelectedItem(null)
      resetForm()
      loadInventory()
    } catch (error: any) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update inventory item",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!selectedItem) return

    setSubmitting(true)
    try {
      // Note: API doesn't have DELETE, so we'll use PUT to set quantity to 0 or mark as deleted
      // For now, we'll just show a message that deletion should be done via update
      toast({
        title: "Info",
        description: "To remove an item, update its quantity to 0 or contact an administrator",
      })
      setDeleteItemOpen(false)
      setSelectedItem(null)
    } catch (error: any) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete inventory item",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUseItem = async (item: any) => {
    try {
      const response = await fetch("/api/facility-inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          action: "use",
        }),
      })

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Success",
        description: `Used 1 ${item.unit_of_measure} of ${item.item_name}. Remaining: ${result.quantity}`,
      })
      loadInventory()
    } catch (error: any) {
      console.error("Error using item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to use inventory item",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setItemForm({
      item_name: "",
      category: "medical",
      quantity: 0,
      unit_of_measure: "",
      reorder_level: 10,
      expiration_date: "",
      lot_number: "",
      storage_location: "",
      notes: "",
    })
  }

  const openEditDialog = (item: any) => {
    setSelectedItem(item)
    setItemForm({
      item_name: item.item_name || "",
      category: item.category || "medical",
      quantity: item.quantity || 0,
      unit_of_measure: item.unit_of_measure || "",
      reorder_level: item.reorder_level || 10,
      expiration_date: item.expiration_date ? item.expiration_date.split("T")[0] : "",
      lot_number: item.lot_number || "",
      storage_location: item.storage_location || "",
      notes: item.notes || "",
    })
    setEditItemOpen(true)
  }

  const filteredInventory = inventory.filter((item) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      item.item_name?.toLowerCase().includes(searchLower) ||
      item.storage_location?.toLowerCase().includes(searchLower) ||
      item.lot_number?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower)
    )
  })

  const getStatusBadge = (item: any) => {
    if (item.quantity <= item.reorder_level) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Low Stock
        </Badge>
      )
    }
    if (item.expiration_date) {
      const expirationDate = new Date(item.expiration_date)
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      if (expirationDate <= thirtyDaysFromNow && expirationDate >= now) {
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-700">
            <Clock className="mr-1 h-3 w-3" />
            Expiring Soon
          </Badge>
        )
      }
      if (expirationDate < now) {
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        )
      }
    }
    return (
      <Badge variant="secondary">
        <CheckCircle className="mr-1 h-3 w-3" />
        In Stock
      </Badge>
    )
  }

  const categories = ["all", "medical", "vaccines", "cleaning", "medications", "wound-care"]

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader />
        <div className="p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Facility Inventory</h1>
              <p className="text-muted-foreground">Track medical supplies, medications, and equipment</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadInventory} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Dialog open={newItemOpen} onOpenChange={setNewItemOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                    <DialogDescription>Add a new item to the facility inventory</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Item Name *</Label>
                        <Input
                          value={itemForm.item_name}
                          onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })}
                          placeholder="e.g., Influenza Vaccine 2024-25"
                        />
                      </div>
                      <div>
                        <Label>Category *</Label>
                        <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="medical">Medical Supplies</SelectItem>
                            <SelectItem value="vaccines">Vaccines</SelectItem>
                            <SelectItem value="cleaning">Cleaning Supplies</SelectItem>
                            <SelectItem value="medications">Medications</SelectItem>
                            <SelectItem value="wound-care">Wound Care</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min={0}
                          value={itemForm.quantity}
                          onChange={(e) => setItemForm({ ...itemForm, quantity: Number.parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label>Unit of Measure *</Label>
                        <Input
                          value={itemForm.unit_of_measure}
                          onChange={(e) => setItemForm({ ...itemForm, unit_of_measure: e.target.value })}
                          placeholder="e.g., doses, boxes, units"
                        />
                      </div>
                      <div>
                        <Label>Reorder Level</Label>
                        <Input
                          type="number"
                          min={0}
                          value={itemForm.reorder_level}
                          onChange={(e) => setItemForm({ ...itemForm, reorder_level: Number.parseInt(e.target.value) || 10 })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Expiration Date</Label>
                        <Input
                          type="date"
                          value={itemForm.expiration_date}
                          onChange={(e) => setItemForm({ ...itemForm, expiration_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Lot Number</Label>
                        <Input
                          value={itemForm.lot_number}
                          onChange={(e) => setItemForm({ ...itemForm, lot_number: e.target.value })}
                          placeholder="e.g., FLU-2024-A"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Storage Location</Label>
                      <Input
                        value={itemForm.storage_location}
                        onChange={(e) => setItemForm({ ...itemForm, storage_location: e.target.value })}
                        placeholder="e.g., Refrigerator Unit A, Supply Room B"
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={itemForm.notes}
                        onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                        placeholder="Additional notes about this item..."
                        rows={3}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNewItemOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateItem} disabled={submitting}>
                        {submitting ? "Adding..." : "Add Item"}
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">All inventory items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.lowStockAlerts}</div>
                <p className="text-xs text-muted-foreground">Needs reordering</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.expiringSoon}</div>
                <p className="text-xs text-muted-foreground">Within 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.categories}</div>
                <p className="text-xs text-muted-foreground">Active categories</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Manage and track facility inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading inventory...</p>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inventory items found.</p>
                  <p className="text-sm">Click "Add Item" to create one.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Reorder Level</TableHead>
                      <TableHead>Storage Location</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={item.quantity <= item.reorder_level ? "font-bold text-orange-600" : ""}>
                            {item.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{item.unit_of_measure}</TableCell>
                        <TableCell>{item.reorder_level}</TableCell>
                        <TableCell>{item.storage_location || "-"}</TableCell>
                        <TableCell>
                          {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(item)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUseItem(item)}
                              disabled={item.quantity <= 0}
                              title="Use 1 unit"
                            >
                              <TrendingDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          {stats.lowStockItems.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>Items that need to be reordered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {item.quantity} {item.unit_of_measure} | Reorder at: {item.reorder_level}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                        Update
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Item Dialog */}
      <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update inventory item details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Item Name *</Label>
                <Input
                  value={itemForm.item_name}
                  onChange={(e) => setItemForm({ ...itemForm, item_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={itemForm.category} onValueChange={(v) => setItemForm({ ...itemForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical">Medical Supplies</SelectItem>
                    <SelectItem value="vaccines">Vaccines</SelectItem>
                    <SelectItem value="cleaning">Cleaning Supplies</SelectItem>
                    <SelectItem value="medications">Medications</SelectItem>
                    <SelectItem value="wound-care">Wound Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min={0}
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Unit of Measure *</Label>
                <Input
                  value={itemForm.unit_of_measure}
                  onChange={(e) => setItemForm({ ...itemForm, unit_of_measure: e.target.value })}
                />
              </div>
              <div>
                <Label>Reorder Level</Label>
                <Input
                  type="number"
                  min={0}
                  value={itemForm.reorder_level}
                  onChange={(e) => setItemForm({ ...itemForm, reorder_level: Number.parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiration Date</Label>
                <Input
                  type="date"
                  value={itemForm.expiration_date}
                  onChange={(e) => setItemForm({ ...itemForm, expiration_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Lot Number</Label>
                <Input
                  value={itemForm.lot_number}
                  onChange={(e) => setItemForm({ ...itemForm, lot_number: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Storage Location</Label>
              <Input
                value={itemForm.storage_location}
                onChange={(e) => setItemForm({ ...itemForm, storage_location: e.target.value })}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={itemForm.notes}
                onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditItemOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateItem} disabled={submitting}>
                {submitting ? "Updating..." : "Update Item"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteItemOpen} onOpenChange={setDeleteItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inventory Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedItem?.item_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItemOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
