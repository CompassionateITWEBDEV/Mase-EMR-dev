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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  Package,
  DollarSign,
  AlertTriangle,
  FileText,
  TrendingUp,
  Info,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const RATE_CODES_2024 = {
  // Freestanding OTP Bundles
  freestanding: {
    methadone: {
      weekly: {
        code: "7969",
        rate: 258.77,
        hcpcs: "G2067",
        description: "Methadone Weekly Bundle",
      },
      takehome: {
        code: "7970",
        rate: 92.42,
        hcpcs: "G2078",
        description: "Methadone Take-Home Bundle",
      },
    },
    buprenorphine: {
      weekly: {
        code: "7971",
        rate: 246.33,
        hcpcs: "G2068",
        description: "Buprenorphine Weekly Bundle",
      },
      takehome: {
        code: "7972",
        rate: 88.17,
        hcpcs: "G2079",
        description: "Buprenorphine Take-Home Bundle",
      },
    },
    naltrexone: {
      weekly: {
        code: "7983",
        rate: 189.45,
        hcpcs: "G2069",
        description: "Naltrexone Weekly Bundle",
      },
      injection: {
        code: "7984",
        rate: 425.0,
        hcpcs: "J2315",
        description: "Vivitrol Injection",
      },
    },
  },
  // Hospital-Based OTP Bundles
  hospitalBased: {
    methadone: {
      weekly: {
        code: "7973",
        rate: 271.21,
        hcpcs: "G2067",
        description: "Methadone Weekly Bundle (Hospital)",
      },
      takehome: {
        code: "7974",
        rate: 97.04,
        hcpcs: "G2078",
        description: "Methadone Take-Home Bundle (Hospital)",
      },
    },
    buprenorphine: {
      weekly: {
        code: "7975",
        rate: 258.65,
        hcpcs: "G2068",
        description: "Buprenorphine Weekly Bundle (Hospital)",
      },
      takehome: {
        code: "7976",
        rate: 92.58,
        hcpcs: "G2079",
        description: "Buprenorphine Take-Home Bundle (Hospital)",
      },
    },
    naltrexone: {
      weekly: {
        code: "7985",
        rate: 198.92,
        hcpcs: "G2069",
        description: "Naltrexone Weekly Bundle (Hospital)",
      },
      injection: {
        code: "7986",
        rate: 446.25,
        hcpcs: "J2315",
        description: "Vivitrol Injection (Hospital)",
      },
    },
  },
  // APG Rates for Non-Qualifying Services
  apg: {
    admission: {
      code: "APG-001",
      rate: 156.78,
      hcpcs: "H0001",
      description: "Admission Assessment",
    },
    periodicAssessment: {
      code: "APG-002",
      rate: 89.45,
      hcpcs: "H0031",
      description: "Periodic Assessment",
    },
    psychiatricEval: {
      code: "APG-003",
      rate: 187.23,
      hcpcs: "90792",
      description: "Psychiatric Evaluation",
    },
    peerServices: {
      code: "APG-004",
      rate: 45.67,
      hcpcs: "H0038",
      description: "Peer Services",
    },
    smokingCessation: {
      code: "APG-005",
      rate: 52.34,
      hcpcs: "99406",
      description: "Smoking Cessation",
    },
    medicalVisit: {
      code: "APG-006",
      rate: 78.9,
      hcpcs: "99213",
      description: "Medical Visit",
    },
    crisisIntervention: {
      code: "APG-007",
      rate: 134.56,
      hcpcs: "H2011",
      description: "Crisis Intervention",
    },
    familyTherapy: {
      code: "APG-008",
      rate: 112.34,
      hcpcs: "90847",
      description: "Family Therapy",
    },
  },
};

export function OTPBundleCalculator() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [medicationType, setMedicationType] = useState("");
  const [patientType, setPatientType] = useState("");
  const [facilityType, setFacilityType] = useState("");
  const [takehomeDays, setTakehomeDays] = useState("");
  const [recommendation, setRecommendation] = useState<any>(null);
  const [showRateSheet, setShowRateSheet] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const qualifyingServices = [
    {
      id: "individual-counseling",
      label: "Individual Counseling (15+ min)",
      qualifying: true,
    },
    { id: "group-counseling", label: "Group Counseling", qualifying: true },
    {
      id: "medication-admin",
      label: "Medication Administration/Observation",
      qualifying: true,
    },
    { id: "medication-mgmt", label: "Medication Management", qualifying: true },
    {
      id: "brief-treatment",
      label: "Brief Treatment (Under 15 min)",
      qualifying: true,
    },
    {
      id: "toxicology",
      label: "Presumptive Toxicology Testing",
      qualifying: true,
    },
    {
      id: "definitive-tox",
      label: "Definitive Toxicology (Confirmation)",
      qualifying: true,
    },
  ];

  const nonQualifyingServices = [
    {
      id: "admission-assessment",
      label: "Admission Assessment",
      rate: RATE_CODES_2024.apg.admission.rate,
    },
    {
      id: "periodic-assessment",
      label: "Periodic Assessment",
      rate: RATE_CODES_2024.apg.periodicAssessment.rate,
    },
    {
      id: "psychiatric-eval",
      label: "Psychiatric Evaluation",
      rate: RATE_CODES_2024.apg.psychiatricEval.rate,
    },
    {
      id: "peer-services",
      label: "Peer Services",
      rate: RATE_CODES_2024.apg.peerServices.rate,
    },
    {
      id: "smoking-cessation",
      label: "Smoking Cessation",
      rate: RATE_CODES_2024.apg.smokingCessation.rate,
    },
    {
      id: "medical-visit",
      label: "Unrelated Medical Visit",
      rate: RATE_CODES_2024.apg.medicalVisit.rate,
    },
    {
      id: "crisis-intervention",
      label: "Crisis Intervention",
      rate: RATE_CODES_2024.apg.crisisIntervention.rate,
    },
    {
      id: "family-therapy",
      label: "Family Therapy",
      rate: RATE_CODES_2024.apg.familyTherapy.rate,
    },
  ];

  const calculateRecommendation = () => {
    if (!medicationType || !patientType || !facilityType) {
      toast.error(
        "Please select medication type, patient type, and facility type"
      );
      return;
    }

    const hasQualifyingServices = selectedServices.some((service) =>
      qualifyingServices.find((qs) => qs.id === service)
    );
    const selectedNonQualifying = selectedServices.filter((service) =>
      nonQualifyingServices.find((nqs) => nqs.id === service)
    );
    const hasMedicationAdmin = selectedServices.includes("medication-admin");
    const isTakehome = !hasMedicationAdmin && hasQualifyingServices;

    const facilityRates =
      facilityType === "hospital-based"
        ? RATE_CODES_2024.hospitalBased
        : RATE_CODES_2024.freestanding;

    let billingMethod = "";
    const rateCodes: { code: string; description: string; rate: number }[] = [];
    const procedureCodes: string[] = [];
    let estimatedReimbursement = 0;
    const notes: string[] = [];
    const warnings: string[] = [];

    // Calculate bundle vs APG comparison
    let bundleTotal = 0;
    let apgTotal = 0;

    // Determine billing method based on OASAS guidelines
    if (patientType === "guest-dosing") {
      billingMethod = "APG Only (Guest Dosing)";
      warnings.push(
        "Guest dosing patients cannot use bundle billing per OASAS guidelines"
      );
      // Calculate APG only
      apgTotal = selectedNonQualifying.reduce((sum, serviceId) => {
        const service = nonQualifyingServices.find((s) => s.id === serviceId);
        return sum + (service?.rate || 0);
      }, 0);
      estimatedReimbursement = apgTotal;
    } else if (hasQualifyingServices) {
      const medRates =
        facilityRates[medicationType as keyof typeof facilityRates];

      if (isTakehome && takehomeDays) {
        // Take-home scenario - only available for methadone and buprenorphine
        if ("takehome" in medRates) {
          billingMethod = "Take-Home Bundle";
          const bundleInfo = medRates.takehome;
          const days = Number.parseInt(takehomeDays) || 1;
          rateCodes.push({
            code: bundleInfo.code,
            description: bundleInfo.description,
            rate: bundleInfo.rate * days,
          });
          procedureCodes.push(bundleInfo.hcpcs);
          bundleTotal = bundleInfo.rate * days;
          notes.push(`Take-home bottles for ${days} day(s)`);

          if (days > 27) {
            warnings.push(
              "Maximum take-home is typically 27 days per month - verify with OASAS guidelines"
            );
          }
        } else {
          // Naltrexone doesn't support take-home, fall back to weekly bundle
          warnings.push(
            "Take-home bundles are not available for this medication type. Using weekly bundle instead."
          );
          billingMethod = "Weekly Bundle";
          const bundleInfo = medRates.weekly;
          rateCodes.push({
            code: bundleInfo.code,
            description: bundleInfo.description,
            rate: bundleInfo.rate,
          });
          procedureCodes.push(bundleInfo.hcpcs);
          bundleTotal = bundleInfo.rate;
        }
      } else {
        // Weekly bundle
        billingMethod = "Weekly Bundle";
        const bundleInfo = medRates.weekly;
        rateCodes.push({
          code: bundleInfo.code,
          description: bundleInfo.description,
          rate: bundleInfo.rate,
        });
        procedureCodes.push(bundleInfo.hcpcs);
        bundleTotal = bundleInfo.rate;
      }

      // Add APG for non-qualifying services
      if (selectedNonQualifying.length > 0) {
        billingMethod += " + APG for Non-Qualifying Services";
        selectedNonQualifying.forEach((serviceId) => {
          const service = nonQualifyingServices.find((s) => s.id === serviceId);
          if (service) {
            const apgInfo = Object.values(RATE_CODES_2024.apg).find((a) =>
              a.description
                .toLowerCase()
                .includes(service.label.split(" ")[0].toLowerCase())
            );
            if (apgInfo) {
              rateCodes.push({
                code: apgInfo.code,
                description: apgInfo.description,
                rate: apgInfo.rate,
              });
              procedureCodes.push(apgInfo.hcpcs);
              apgTotal += apgInfo.rate;
            }
          }
        });
        notes.push(
          "Submit separate APG claim for non-qualifying services on same day"
        );
      }

      estimatedReimbursement = bundleTotal + apgTotal;
    } else if (selectedNonQualifying.length > 0) {
      billingMethod = "APG Only";
      selectedNonQualifying.forEach((serviceId) => {
        const service = nonQualifyingServices.find((s) => s.id === serviceId);
        if (service) {
          const apgInfo = Object.values(RATE_CODES_2024.apg).find((a) =>
            a.description
              .toLowerCase()
              .includes(service.label.split(" ")[0].toLowerCase())
          ) || {
            code: "APG",
            description: service.label,
            rate: service.rate,
            hcpcs: "H0001",
          };
          rateCodes.push({
            code: apgInfo.code,
            description: apgInfo.description,
            rate: apgInfo.rate,
          });
          procedureCodes.push(apgInfo.hcpcs);
          apgTotal += apgInfo.rate;
        }
      });
      estimatedReimbursement = apgTotal;
      notes.push("No qualifying services for bundle billing - use APG");
    }

    // Special case handling
    if (patientType === "dual-eligible") {
      notes.push("Dual Eligible: Submit to Medicare first using G codes");
      notes.push("After Medicare payment, submit crossover claim to Medicaid");
      notes.push("Medicaid will pay difference up to bundle rate");
    }

    if (patientType === "nursing-home") {
      notes.push(
        "SNF patients: Coordinate with facility billing to avoid duplicate claims"
      );
      notes.push("Use modifier -32 if mandated services");
    }

    if (facilityType === "fqhc") {
      warnings.push(
        "FQHC: Cannot bill 1671 PPS rate code and OTP bundle in same week"
      );
      notes.push("Choose either FQHC encounter rate OR OTP bundle - not both");
    }

    if (facilityType === "ccbhc") {
      warnings.push(
        "CCBHC: Medication administration is carved out of 1147 daily rate"
      );
      notes.push("Bill medication costs separately from CCBHC daily rate");
    }

    // Set comparison result for display
    setComparisonResult({
      bundleTotal,
      apgTotal,
      combinedTotal: bundleTotal + apgTotal,
      recommendation:
        bundleTotal > apgTotal
          ? "Bundle billing maximizes reimbursement"
          : apgTotal > bundleTotal
          ? "APG billing may be more appropriate"
          : "Combined billing recommended",
    });

    setRecommendation({
      billingMethod,
      rateCodes,
      procedureCodes: [...new Set(procedureCodes)],
      estimatedReimbursement,
      notes,
      warnings,
    });

    toast.success("Calculation complete");
  };

  const resetCalculator = () => {
    setSelectedServices([]);
    setMedicationType("");
    setPatientType("");
    setFacilityType("");
    setTakehomeDays("");
    setRecommendation(null);
    setComparisonResult(null);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="rate-sheet">2024 Rate Sheet</TabsTrigger>
          <TabsTrigger value="guidelines">OASAS Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                OTP Bundle vs APG Calculator
              </CardTitle>
              <CardDescription>
                OASAS-compliant billing decision support tool with 2024 rate
                codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient and Facility Information */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Medication Type *
                  </label>
                  <Select
                    value={medicationType}
                    onValueChange={setMedicationType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="methadone">Methadone</SelectItem>
                      <SelectItem value="buprenorphine">
                        Buprenorphine/Suboxone
                      </SelectItem>
                      <SelectItem value="naltrexone">
                        Naltrexone/Vivitrol
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Patient Type *</label>
                  <Select value={patientType} onValueChange={setPatientType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicaid-only">
                        Medicaid Only
                      </SelectItem>
                      <SelectItem value="dual-eligible">
                        Dual Eligible (Medicare/Medicaid)
                      </SelectItem>
                      <SelectItem value="guest-dosing">Guest Dosing</SelectItem>
                      <SelectItem value="nursing-home">
                        Skilled Nursing Facility
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Facility Type *</label>
                  <Select value={facilityType} onValueChange={setFacilityType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select facility type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freestanding">
                        Freestanding OTP
                      </SelectItem>
                      <SelectItem value="hospital-based">
                        Hospital-Based OTP
                      </SelectItem>
                      <SelectItem value="fqhc">FQHC</SelectItem>
                      <SelectItem value="ccbhc">CCBHC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Take-Home Days</label>
                  <Input
                    type="number"
                    min="0"
                    max="28"
                    placeholder="0"
                    value={takehomeDays}
                    onChange={(e) => setTakehomeDays(e.target.value)}
                  />
                </div>
              </div>

              {/* Services Selection */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-medium text-green-600 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Qualifying Services (Bundle Eligible)
                  </h3>
                  <div className="space-y-3 p-4 border border-green-200 rounded-lg bg-green-50/50">
                    {qualifyingServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-2">
                        <Checkbox
                          id={service.id}
                          checked={selectedServices.includes(service.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedServices([
                                ...selectedServices,
                                service.id,
                              ]);
                            } else {
                              setSelectedServices(
                                selectedServices.filter((s) => s !== service.id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={service.id}
                          className="text-sm cursor-pointer">
                          {service.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-blue-600 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Non-Qualifying Services (APG Required)
                  </h3>
                  <div className="space-y-3 p-4 border border-blue-200 rounded-lg bg-blue-50/50">
                    {nonQualifyingServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={service.id}
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedServices([
                                  ...selectedServices,
                                  service.id,
                                ]);
                              } else {
                                setSelectedServices(
                                  selectedServices.filter(
                                    (s) => s !== service.id
                                  )
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={service.id}
                            className="text-sm cursor-pointer">
                            {service.label}
                          </label>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          ${service.rate.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={calculateRecommendation}
                  className="flex-1"
                  disabled={selectedServices.length === 0}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Billing Recommendation
                </Button>
                <Button variant="outline" onClick={resetCalculator}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recommendation Results */}
          {recommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Billing Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Warnings */}
                {recommendation.warnings?.length > 0 && (
                  <div className="p-4 border border-yellow-300 rounded-lg bg-yellow-50">
                    <h4 className="font-medium text-yellow-800 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Warnings
                    </h4>
                    <ul className="space-y-1">
                      {recommendation.warnings.map(
                        (warning: string, index: number) => (
                          <li key={index} className="text-sm text-yellow-700">
                            • {warning}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Recommended Billing Method:
                      </label>
                      <p className="text-xl font-semibold text-primary">
                        {recommendation.billingMethod}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Rate Codes & Amounts:
                      </label>
                      <div className="space-y-2 mt-2">
                        {recommendation.rateCodes.map(
                          (rc: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center p-2 bg-muted rounded">
                              <div>
                                <Badge variant="default" className="mr-2">
                                  {rc.code}
                                </Badge>
                                <span className="text-sm">
                                  {rc.description}
                                </span>
                              </div>
                              <span className="font-medium">
                                ${rc.rate.toFixed(2)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        HCPCS/Procedure Codes:
                      </label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {recommendation.procedureCodes.map((code: string) => (
                          <Badge key={code} variant="secondary">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-green-600" />
                        <div>
                          <label className="text-sm font-medium text-green-700">
                            Total Estimated Reimbursement:
                          </label>
                          <p className="text-3xl font-bold text-green-600">
                            ${recommendation.estimatedReimbursement.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {comparisonResult && (
                      <div className="p-4 border rounded-lg space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Breakdown
                        </h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Bundle Amount:</span>
                            <span className="font-medium">
                              ${comparisonResult.bundleTotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>APG Amount:</span>
                            <span className="font-medium">
                              ${comparisonResult.apgTotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-1 mt-1">
                            <span className="font-medium">Combined Total:</span>
                            <span className="font-bold">
                              ${comparisonResult.combinedTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {recommendation.notes?.length > 0 && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4" />
                      Billing Notes
                    </h4>
                    <ul className="space-y-1">
                      {recommendation.notes.map(
                        (note: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground">
                            • {note}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rate-sheet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>2024 OASAS OTP Rate Codes</CardTitle>
              <CardDescription>
                Current Medicaid reimbursement rates effective January 2024
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Freestanding OTP Rates</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Rate Code</th>
                          <th className="text-left p-3">Description</th>
                          <th className="text-left p-3">HCPCS</th>
                          <th className="text-right p-3">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(RATE_CODES_2024.freestanding).map(
                          ([med, rates]) =>
                            Object.entries(rates).map(([type, info]) => (
                              <tr key={`${med}-${type}`} className="border-t">
                                <td className="p-3 font-mono">{info.code}</td>
                                <td className="p-3">{info.description}</td>
                                <td className="p-3 font-mono">{info.hcpcs}</td>
                                <td className="p-3 text-right font-medium">
                                  ${info.rate.toFixed(2)}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Hospital-Based OTP Rates</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Rate Code</th>
                          <th className="text-left p-3">Description</th>
                          <th className="text-left p-3">HCPCS</th>
                          <th className="text-right p-3">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(RATE_CODES_2024.hospitalBased).map(
                          ([med, rates]) =>
                            Object.entries(rates).map(([type, info]) => (
                              <tr key={`${med}-${type}`} className="border-t">
                                <td className="p-3 font-mono">{info.code}</td>
                                <td className="p-3">{info.description}</td>
                                <td className="p-3 font-mono">{info.hcpcs}</td>
                                <td className="p-3 text-right font-medium">
                                  ${info.rate.toFixed(2)}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">
                    APG Rates (Non-Qualifying Services)
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-3">Code</th>
                          <th className="text-left p-3">Description</th>
                          <th className="text-left p-3">HCPCS</th>
                          <th className="text-right p-3">Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(RATE_CODES_2024.apg).map(
                          ([key, info]) => (
                            <tr key={key} className="border-t">
                              <td className="p-3 font-mono">{info.code}</td>
                              <td className="p-3">{info.description}</td>
                              <td className="p-3 font-mono">{info.hcpcs}</td>
                              <td className="p-3 text-right font-medium">
                                ${info.rate.toFixed(2)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>OASAS Bundle Billing Guidelines</CardTitle>
              <CardDescription>
                Key rules for OTP bundle vs APG billing decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-green-600 mb-2">
                    Bundle-Eligible (Qualifying) Services
                  </h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Individual counseling (15+ minutes)</li>
                    <li>• Group counseling</li>
                    <li>• Medication administration/observation</li>
                    <li>• Medication management</li>
                    <li>• Brief treatment (under 15 minutes)</li>
                    <li>• Presumptive toxicology testing</li>
                    <li>• Definitive toxicology (confirmation testing)</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-blue-600 mb-2">
                    Non-Qualifying Services (Bill APG)
                  </h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Admission assessments</li>
                    <li>• Periodic assessments</li>
                    <li>• Psychiatric evaluations</li>
                    <li>• Peer support services</li>
                    <li>• Smoking cessation counseling</li>
                    <li>• Medical visits unrelated to OUD treatment</li>
                    <li>• Family therapy</li>
                    <li>• Crisis intervention</li>
                  </ul>
                </div>

                <div className="p-4 border border-yellow-300 rounded-lg bg-yellow-50">
                  <h3 className="font-medium text-yellow-800 mb-2">
                    Special Billing Rules
                  </h3>
                  <ul className="text-sm space-y-2 text-yellow-700">
                    <li>
                      <strong>Guest Dosing:</strong> Cannot use bundle billing -
                      must use APG for all services
                    </li>
                    <li>
                      <strong>Dual Eligible:</strong> Submit to Medicare first,
                      then crossover to Medicaid for balance
                    </li>
                    <li>
                      <strong>FQHC:</strong> Cannot bill 1671 PPS rate and OTP
                      bundle in same week
                    </li>
                    <li>
                      <strong>CCBHC:</strong> Medication administration carved
                      out of 1147 daily rate
                    </li>
                    <li>
                      <strong>Take-Home:</strong> Use take-home bundle rate code
                      for days patient receives take-homes without clinic visit
                    </li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">
                    Documentation Requirements
                  </h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• All services must be documented in patient record</li>
                    <li>
                      • Counseling notes must include start/end time and
                      duration
                    </li>
                    <li>
                      • Medication administration must be witnessed and
                      documented
                    </li>
                    <li>
                      • Toxicology results must be maintained per OASAS
                      requirements
                    </li>
                    <li>• Prior authorization required for certain services</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
