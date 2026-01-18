"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Calendar,
  FileCheck,
  Shield,
  Plus,
  Loader2,
} from "lucide-react";

interface ProviderCredentialManagementProps {
  licenses: any[];
  npiRecords: any[];
  providers: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ProviderCredentialManagement({
  licenses,
  npiRecords,
  providers,
  isLoading,
  onRefresh,
}: ProviderCredentialManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [credentialType, setCredentialType] = useState<
    "license" | "certification" | "board"
  >("license");
  const [isSaving, setIsSaving] = useState(false);
  const [viewDetails, setViewDetails] = useState<any | null>(null);
  const [newCredential, setNewCredential] = useState({
    providerId: "",
    licenseNumber: "",
    licenseType: "",
    issuingState: "",
    issueDate: "",
    expirationDate: "",
    renewalRequiredBy: "",
    cmeRequirements: "",
    autoVerifyEnabled: false,
    notes: "",
  });

  // Combine licenses and NPI records into credentials list
  const allCredentials = [
    ...licenses.map((l) => ({
      id: l.id,
      type: "License",
      providerName: l.providerName,
      credentialNumber: l.license_number,
      credentialType: l.license_type,
      issuingOrganization: `${l.issuing_state} State Board`,
      issuingState: l.issuing_state,
      issueDate: l.issue_date,
      expirationDate: l.expiration_date,
      verificationStatus: l.verification_status,
      verificationDate: l.verification_date,
      renewalRequiredBy: l.renewal_required_by,
      cmeRequirements: l.cme_requirements,
      notes: l.notes,
    })),
    ...npiRecords.map((n) => ({
      id: n.id,
      type: "NPI",
      providerName: n.providerName,
      credentialNumber: n.npi_number,
      credentialType: "NPI",
      issuingOrganization: "CMS/NPPES",
      issuingState: null,
      issueDate: null,
      expirationDate: null,
      verificationStatus: n.verification_status,
      verificationDate: n.verification_date,
      renewalRequiredBy: null as string | null,
      notes: n.notes,
    })),
  ];

  const filteredCredentials = allCredentials.filter(
    (credential) =>
      credential.providerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      credential.credentialNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      credential.credentialType
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      credential.issuingOrganization
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "expired":
      case "suspended":
      case "revoked":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <UserCheck className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (
    status: string
  ): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case "verified":
        return "default";
      case "expired":
      case "suspended":
      case "revoked":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  const isExpiringSoon = (expirationDate?: string) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil(
      (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
    );
    return daysUntilExpiration <= 90 && daysUntilExpiration > 0;
  };

  const handleAddCredential = async () => {
    if (
      !newCredential.providerId ||
      !newCredential.licenseNumber ||
      !newCredential.licenseType
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/provider-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "license",
          providerId: newCredential.providerId,
          licenseNumber: newCredential.licenseNumber,
          licenseType: newCredential.licenseType,
          issuingState: newCredential.issuingState,
          issueDate: newCredential.issueDate || null,
          expirationDate: newCredential.expirationDate,
          renewalRequiredBy: newCredential.renewalRequiredBy || null,
          cmeRequirements: newCredential.cmeRequirements || null,
          autoVerifyEnabled: newCredential.autoVerifyEnabled,
          notes: newCredential.notes || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to add credential");

      toast.success("Credential added successfully");
      setNewCredential({
        providerId: "",
        licenseNumber: "",
        licenseType: "",
        issuingState: "",
        issueDate: "",
        expirationDate: "",
        renewalRequiredBy: "",
        cmeRequirements: "",
        autoVerifyEnabled: false,
        notes: "",
      });
      setShowAddCredential(false);
      onRefresh();
    } catch (error) {
      toast.error("Failed to add credential");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Provider Credential Management</h2>
          <p className="text-muted-foreground">
            Manage provider certifications, board credentials, and professional
            licenses
          </p>
        </div>
        <Button
          onClick={() => setShowAddCredential(true)}
          className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Credential
        </Button>
      </div>

      <Dialog open={showAddCredential} onOpenChange={setShowAddCredential}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Credential</DialogTitle>
            <DialogDescription>
              Add a license, certification, or board credential for a provider
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Provider *</Label>
                <Select
                  value={newCredential.providerId}
                  onValueChange={(value) =>
                    setNewCredential({ ...newCredential, providerId: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.first_name} {provider.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Credential Type *</Label>
                <Select
                  value={newCredential.licenseType}
                  onValueChange={(value) =>
                    setNewCredential({ ...newCredential, licenseType: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MD">MD - Medical Doctor</SelectItem>
                    <SelectItem value="DO">
                      DO - Doctor of Osteopathy
                    </SelectItem>
                    <SelectItem value="NP">NP - Nurse Practitioner</SelectItem>
                    <SelectItem value="PA">PA - Physician Assistant</SelectItem>
                    <SelectItem value="LCSW">
                      LCSW - Licensed Clinical Social Worker
                    </SelectItem>
                    <SelectItem value="LPC">
                      LPC - Licensed Professional Counselor
                    </SelectItem>
                    <SelectItem value="PhD">PhD - Psychology</SelectItem>
                    <SelectItem value="PsyD">
                      PsyD - Doctor of Psychology
                    </SelectItem>
                    <SelectItem value="RN">RN - Registered Nurse</SelectItem>
                    <SelectItem value="LPN">
                      LPN - Licensed Practical Nurse
                    </SelectItem>
                    <SelectItem value="CADC">
                      CADC - Certified Alcohol & Drug Counselor
                    </SelectItem>
                    <SelectItem value="DEA">DEA Registration</SelectItem>
                    <SelectItem value="Board Certification">
                      Board Certification
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>License/Credential Number *</Label>
                <Input
                  value={newCredential.licenseNumber}
                  onChange={(e) =>
                    setNewCredential({
                      ...newCredential,
                      licenseNumber: e.target.value,
                    })
                  }
                  placeholder="Enter license number"
                />
              </div>
              <div>
                <Label>Issuing State/Authority</Label>
                <Select
                  value={newCredential.issuingState}
                  onValueChange={(value) =>
                    setNewCredential({ ...newCredential, issuingState: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MI">Michigan</SelectItem>
                    <SelectItem value="OH">Ohio</SelectItem>
                    <SelectItem value="IN">Indiana</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="WI">Wisconsin</SelectItem>
                    <SelectItem value="Federal">Federal (DEA)</SelectItem>
                    <SelectItem value="National">National Board</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={newCredential.issueDate}
                  onChange={(e) =>
                    setNewCredential({
                      ...newCredential,
                      issueDate: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Expiration Date</Label>
                <Input
                  type="date"
                  value={newCredential.expirationDate}
                  onChange={(e) =>
                    setNewCredential({
                      ...newCredential,
                      expirationDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Renewal Required By</Label>
                <Input
                  type="date"
                  value={newCredential.renewalRequiredBy}
                  onChange={(e) =>
                    setNewCredential({
                      ...newCredential,
                      renewalRequiredBy: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>CME Requirements</Label>
                <Input
                  value={newCredential.cmeRequirements}
                  onChange={(e) =>
                    setNewCredential({
                      ...newCredential,
                      cmeRequirements: e.target.value,
                    })
                  }
                  placeholder="e.g., 50 hours/2 years"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={newCredential.notes}
                onChange={(e) =>
                  setNewCredential({ ...newCredential, notes: e.target.value })
                }
                placeholder="Additional notes about this credential..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddCredential} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Add Credential
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddCredential(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by provider name, credential type, organization, or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Total Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allCredentials.length}</div>
            <p className="text-xs text-muted-foreground">
              {licenses.length} licenses, {npiRecords.length} NPI records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                allCredentials.filter(
                  (c) => c.verificationStatus === "verified"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Active and verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                allCredentials.filter(
                  (c) =>
                    c.verificationStatus === "pending" ||
                    c.verificationStatus === "expired"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Pending or expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Credentials List */}
      {filteredCredentials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Credentials Found</h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Add licenses and verify NPI records to see credentials here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCredentials.map((credential) => (
            <Card key={`${credential.type}-${credential.id}`}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {credential.type === "NPI" ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <FileCheck className="h-5 w-5 text-primary" />
                      )}
                      <h3 className="text-lg font-semibold">
                        {credential.providerName}
                      </h3>
                      <Badge variant="outline">{credential.type}</Badge>
                      <Badge variant="outline">
                        {credential.credentialType}
                      </Badge>
                      {credential.credentialNumber && (
                        <Badge variant="outline">
                          {credential.credentialNumber}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        {getStatusIcon(credential.verificationStatus)}
                        <Badge
                          variant={getStatusColor(
                            credential.verificationStatus
                          )}>
                          {credential.verificationStatus?.toUpperCase()}
                        </Badge>
                      </div>
                      {credential.expirationDate &&
                        isExpiringSoon(credential.expirationDate) && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expiring Soon
                          </Badge>
                        )}
                    </div>

                    <div className="mb-2">
                      <span className="font-medium">Issuing Organization:</span>{" "}
                      {credential.issuingOrganization}
                    </div>

                    <div className="grid gap-2 md:grid-cols-3 text-sm mb-3">
                      {credential.expirationDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Expires: {credential.expirationDate}</span>
                        </div>
                      )}
                      {credential.verificationDate && (
                        <div>
                          <span className="font-medium">Verified:</span>{" "}
                          {credential.verificationDate}
                        </div>
                      )}
                      {credential.renewalRequiredBy && (
                        <div>
                          <span className="font-medium">Renew By:</span>{" "}
                          {credential.renewalRequiredBy}
                        </div>
                      )}
                    </div>

                    {credential.notes && (
                      <div className="text-sm mb-3">
                        <span className="font-medium">Notes:</span>{" "}
                        {credential.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewDetails(credential)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={!!viewDetails} onOpenChange={() => setViewDetails(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credential Details</DialogTitle>
          </DialogHeader>
          {viewDetails && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="font-medium">Provider:</span>
                  <span>{viewDetails.providerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Type:</span>
                  <span>{viewDetails.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Credential Type:</span>
                  <span>{viewDetails.credentialType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Number:</span>
                  <span>{viewDetails.credentialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Issuing Organization:</span>
                  <span>{viewDetails.issuingOrganization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge
                    variant={getStatusColor(viewDetails.verificationStatus)}>
                    {viewDetails.verificationStatus?.toUpperCase()}
                  </Badge>
                </div>
                {viewDetails.issueDate && (
                  <div className="flex justify-between">
                    <span className="font-medium">Issue Date:</span>
                    <span>{viewDetails.issueDate}</span>
                  </div>
                )}
                {viewDetails.expirationDate && (
                  <div className="flex justify-between">
                    <span className="font-medium">Expiration Date:</span>
                    <span>{viewDetails.expirationDate}</span>
                  </div>
                )}
                {viewDetails.verificationDate && (
                  <div className="flex justify-between">
                    <span className="font-medium">Verification Date:</span>
                    <span>{viewDetails.verificationDate}</span>
                  </div>
                )}
                {viewDetails.renewalRequiredBy && (
                  <div className="flex justify-between">
                    <span className="font-medium">Renewal Required By:</span>
                    <span>{viewDetails.renewalRequiredBy}</span>
                  </div>
                )}
                {viewDetails.cmeRequirements && (
                  <div className="flex justify-between">
                    <span className="font-medium">CME Requirements:</span>
                    <span>{viewDetails.cmeRequirements}</span>
                  </div>
                )}
                {viewDetails.notes && (
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="text-sm text-muted-foreground">
                      {viewDetails.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
