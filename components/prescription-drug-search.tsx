"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Pill, AlertTriangle, Info, CheckCircle } from "lucide-react";

interface DrugSearchResult {
  ndc: string;
  brand_name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  route: string;
  manufacturer: string;
  dea_schedule?: string;
  is_generic: boolean;
  interactions: DrugInteraction[];
  contraindications: string[];
  warnings: string[];
}

interface DrugInteraction {
  drug_name: string;
  severity: "minor" | "moderate" | "major";
  description: string;
}

export function PrescriptionDrugSearch({
  onSelectDrugAction,
}: {
  onSelectDrugAction?: (drug: DrugSearchResult) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<DrugSearchResult[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DrugSearchResult | null>(
    null
  );
  const [isSearching, setIsSearching] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // Mock API call - replace with actual drug database API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

      // Mock search results
      setSearchResults([
        {
          ndc: "0071-0155-23",
          brand_name: "Lipitor",
          generic_name: "Atorvastatin Calcium",
          strength: "20mg",
          dosage_form: "Tablet",
          route: "Oral",
          manufacturer: "Pfizer",
          is_generic: false,
          interactions: [
            {
              drug_name: "Warfarin",
              severity: "moderate",
              description: "May increase risk of bleeding",
            },
          ],
          contraindications: ["Active liver disease", "Pregnancy"],
          warnings: [
            "Monitor liver function",
            "Muscle pain may indicate rhabdomyolysis",
          ],
        },
        {
          ndc: "0093-0155-01",
          brand_name: "Atorvastatin",
          generic_name: "Atorvastatin Calcium",
          strength: "20mg",
          dosage_form: "Tablet",
          route: "Oral",
          manufacturer: "Teva",
          is_generic: true,
          interactions: [
            {
              drug_name: "Warfarin",
              severity: "moderate",
              description: "May increase risk of bleeding",
            },
          ],
          contraindications: ["Active liver disease", "Pregnancy"],
          warnings: [
            "Monitor liver function",
            "Muscle pain may indicate rhabdomyolysis",
          ],
        },
        {
          ndc: "0071-0156-23",
          brand_name: "Lipitor",
          generic_name: "Atorvastatin Calcium",
          strength: "40mg",
          dosage_form: "Tablet",
          route: "Oral",
          manufacturer: "Pfizer",
          is_generic: false,
          interactions: [
            {
              drug_name: "Warfarin",
              severity: "moderate",
              description: "May increase risk of bleeding",
            },
          ],
          contraindications: ["Active liver disease", "Pregnancy"],
          warnings: [
            "Monitor liver function",
            "Muscle pain may indicate rhabdomyolysis",
          ],
        },
      ]);
    } catch (error) {
      console.error("Drug search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDrug = (drug: DrugSearchResult) => {
    setSelectedDrug(drug);
    if (onSelectDrugAction) {
      onSelectDrugAction(drug);
    }
  };

  const getSeverityColor = (severity: DrugInteraction["severity"]) => {
    switch (severity) {
      case "major":
        return "text-red-600";
      case "moderate":
        return "text-yellow-600";
      case "minor":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getSeverityBadgeVariant = (severity: DrugInteraction["severity"]) => {
    switch (severity) {
      case "major":
        return "destructive";
      case "moderate":
        return "secondary";
      case "minor":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Drug Database Search
          </CardTitle>
          <CardDescription>
            Search for medications by brand name, generic name, or NDC number
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="drug-search">Medication Name or NDC</Label>
              <Input
                id="drug-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter medication name or NDC number..."
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchTerm.trim()}>
                {isSearching ? (
                  <>
                    <Search className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedDrug && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Selected: {selectedDrug.brand_name} ({selectedDrug.generic_name}
                ) {selectedDrug.strength}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {searchResults.length} medications found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((drug) => (
                <div
                  key={drug.ndc}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Pill className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {drug.brand_name}
                        {drug.is_generic && (
                          <Badge variant="outline">Generic</Badge>
                        )}
                        {drug.dea_schedule && (
                          <Badge variant="destructive">
                            Schedule {drug.dea_schedule}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {drug.generic_name} • {drug.strength} {drug.dosage_form}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        NDC: {drug.ndc} • {drug.manufacturer}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {drug.interactions.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {drug.interactions.length} interaction(s)
                      </Badge>
                    )}
                    <Dialog
                      open={showDetailsDialog && selectedDrug?.ndc === drug.ndc}
                      onOpenChange={setShowDetailsDialog}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDrug(drug)}>
                          <Info className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {drug.brand_name} ({drug.generic_name})
                          </DialogTitle>
                          <DialogDescription>
                            {drug.strength} {drug.dosage_form} • NDC: {drug.ndc}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">
                              Drug Information
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">
                                  Manufacturer:
                                </span>{" "}
                                {drug.manufacturer}
                              </div>
                              <div>
                                <span className="font-medium">Route:</span>{" "}
                                {drug.route}
                              </div>
                              <div>
                                <span className="font-medium">Form:</span>{" "}
                                {drug.dosage_form}
                              </div>
                              <div>
                                <span className="font-medium">Strength:</span>{" "}
                                {drug.strength}
                              </div>
                            </div>
                          </div>

                          {drug.interactions.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Drug Interactions
                              </h4>
                              <div className="space-y-2">
                                {drug.interactions.map((interaction, index) => (
                                  <div
                                    key={index}
                                    className="p-3 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge
                                        variant={getSeverityBadgeVariant(
                                          interaction.severity
                                        )}>
                                        {interaction.severity}
                                      </Badge>
                                      <span className="font-medium">
                                        {interaction.drug_name}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {interaction.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {drug.contraindications.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">
                                Contraindications
                              </h4>
                              <ul className="text-sm space-y-1">
                                {drug.contraindications.map(
                                  (contraindication, index) => (
                                    <li
                                      key={index}
                                      className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                      {contraindication}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {drug.warnings.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Warnings</h4>
                              <ul className="text-sm space-y-1">
                                {drug.warnings.map((warning, index) => (
                                  <li
                                    key={index}
                                    className="flex items-center gap-2">
                                    <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" onClick={() => handleSelectDrug(drug)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Select
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
