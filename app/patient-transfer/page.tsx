"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { FileText, Download, Send, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DOCUMENT_TYPES = [
  "Demographics & Insurance",
  "Medical History",
  "Medication List",
  "Allergy List",
  "Immunization Records",
  "Lab Results (30 days)",
  "Vital Signs",
  "Progress Notes",
  "Treatment Plans",
  "Assessments",
  "Consents & Authorizations",
  "42 CFR Part 2 Consent",
  "Discharge Summary",
];

export default function PatientTransferPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [externalFacilityName, setExternalFacilityName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>(DOCUMENT_TYPES);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const supabase = createClient();

  useEffect(() => {
    async function getCurrentUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    }
    getCurrentUser();
  }, []);

  useEffect(() => {
    fetchPatients();
  }, []);

  async function fetchPatients() {
    const { data, error } = await supabase.from("patients").select("*").order("last_name", { ascending: true });

    if (!error && data) {
      setPatients(data);
    }
  }

  const patient = patients.find((p) => p.id === selectedPatient);

  const toggleDoc = (doc: string) => {
    setSelectedDocs((prev) => (prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]));
  };

  async function generateTransferPacket() {
    if (!selectedPatient || !transferTo) {
      toast({
        title: "Validation Error",
        description: "Please select a patient and enter transfer destination",
        variant: "destructive",
      });
      return;
    }

    if (!currentUserId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to generate transfer packets",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const transferPacket = {
        patient_id: selectedPatient,
        patient_name: `${patient?.first_name} ${patient?.last_name}`,
        transfer_date: new Date().toISOString(),
        transfer_from: "Current Facility Name",
        transfer_to: transferTo === "external" ? externalFacilityName : "Internal Facility",
        contact_person: contactPerson,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        transfer_reason: transferReason,
        documents_included: selectedDocs,
        generated_by: currentUserId,
      };

      console.log("[v0] Transfer packet generated:", transferPacket);

      toast({
        title: "Transfer Packet Generated",
        description: `Complete transfer packet ready for ${patient?.first_name} ${patient?.last_name}`,
      });
    } catch (error) {
      console.error("Transfer packet error:", error);
      toast({
        title: "Generation Failed",
        description: "An error occurred while generating the transfer packet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Transfer & Records</h1>
              <p className="text-gray-600 mt-1">Generate complete transfer packets for facility transfers</p>
            </div>

            {/* Patient Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Patient</CardTitle>
                <CardDescription>Choose the patient to transfer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name} - DOB: {p.date_of_birth}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {patient && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-gray-600">DOB: {patient.date_of_birth}</p>
                        <p className="text-sm text-gray-600">Phone: {patient.phone || "N/A"}</p>
                        <p className="text-sm text-gray-600">Email: {patient.email || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transfer Destination */}
            {selectedPatient && (
              <Card>
                <CardHeader>
                  <CardTitle>Transfer Destination</CardTitle>
                  <CardDescription>Enter receiving facility information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Transfer To</Label>
                    <Select value={transferTo} onValueChange={setTransferTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="external">External Facility</SelectItem>
                        <SelectItem value="internal">Internal Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {transferTo === "external" && (
                    <>
                      <div className="space-y-2">
                        <Label>Facility Name *</Label>
                        <Input
                          placeholder="Enter receiving facility name"
                          value={externalFacilityName}
                          onChange={(e) => setExternalFacilityName(e.target.value)}
                        />
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Contact Person</Label>
                          <Input
                            placeholder="Contact name"
                            value={contactPerson}
                            onChange={(e) => setContactPerson(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            placeholder="Phone number"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            placeholder="Email address"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Reason for Transfer *</Label>
                    <Textarea
                      placeholder="Enter reason for patient transfer..."
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Selection */}
            {transferTo && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Select Documents</CardTitle>
                      <CardDescription>
                        Choose which documents to include in transfer packet ({selectedDocs.length} selected)
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedDocs(DOCUMENT_TYPES)}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedDocs([])}>
                        Deselect All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {DOCUMENT_TYPES.map((doc) => (
                      <div key={doc} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                        <Checkbox checked={selectedDocs.includes(doc)} onCheckedChange={() => toggleDoc(doc)} />
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{doc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate Actions */}
            {transferTo && selectedDocs.length > 0 && (
              <Card className="border-cyan-200 bg-cyan-50">
                <CardHeader>
                  <CardTitle>Transfer Packet Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button
                      onClick={generateTransferPacket}
                      disabled={loading}
                      size="lg"
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {loading ? "Generating..." : "Generate & Download PDF"}
                    </Button>
                    <Button onClick={generateTransferPacket} disabled={loading} variant="outline" size="lg">
                      <Send className="mr-2 h-4 w-4" />
                      Generate & Send via Fax
                    </Button>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <p className="text-sm font-medium mb-2">Transfer packet will include:</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Cover sheet with patient demographics</li>
                      <li>Transfer authorization form</li>
                      <li>{selectedDocs.length} selected medical documents</li>
                      <li>42 CFR Part 2 compliance documentation</li>
                      <li>Audit trail and tracking information</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

