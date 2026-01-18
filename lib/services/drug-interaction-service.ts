/**
 * Drug Interaction Service
 * Provides comprehensive drug interaction checking using multiple data sources
 * 
 * Primary: OpenFDA Drug Interaction API (free, no API key required)
 * Fallback: RxNorm/RxNav API (free, NIH-provided)
 * Last Resort: Internal heuristic-based checking
 */

import type {
  DrugInteractionResult,
  DrugInteraction,
} from "@/types/ai-assistant";

// OpenFDA API base URL
const OPENFDA_BASE_URL = "https://api.fda.gov/drug";

// RxNav API base URL
const RXNAV_BASE_URL = "https://rxnav.nlm.nih.gov/REST";

// Known interaction pairs for fallback (common critical interactions)
const KNOWN_INTERACTIONS: Array<{
  drugs: [string, string];
  severity: DrugInteraction["severity"];
  description: string;
  action: string;
}> = [
  {
    drugs: ["warfarin", "aspirin"],
    severity: "major",
    description: "Increased risk of bleeding when used together. Aspirin inhibits platelet aggregation while warfarin inhibits clotting factors.",
    action: "Monitor INR closely, consider alternative antiplatelet if possible",
  },
  {
    drugs: ["warfarin", "ibuprofen"],
    severity: "major",
    description: "NSAIDs increase anticoagulant effect and bleeding risk through multiple mechanisms.",
    action: "Avoid combination if possible, monitor INR closely",
  },
  {
    drugs: ["warfarin", "naproxen"],
    severity: "major",
    description: "NSAIDs increase anticoagulant effect and bleeding risk through multiple mechanisms.",
    action: "Avoid combination if possible, monitor INR closely",
  },
  {
    drugs: ["metformin", "contrast"],
    severity: "major",
    description: "Risk of lactic acidosis with iodinated contrast media.",
    action: "Hold metformin 48 hours before and after contrast administration",
  },
  {
    drugs: ["lisinopril", "potassium"],
    severity: "moderate",
    description: "ACE inhibitors can increase potassium levels; combined with potassium supplements may cause hyperkalemia.",
    action: "Monitor potassium levels regularly",
  },
  {
    drugs: ["simvastatin", "amiodarone"],
    severity: "major",
    description: "Increased risk of myopathy and rhabdomyolysis. Amiodarone inhibits CYP3A4.",
    action: "Limit simvastatin dose to 20mg daily or consider alternative statin",
  },
  {
    drugs: ["clopidogrel", "omeprazole"],
    severity: "moderate",
    description: "Omeprazole may reduce the antiplatelet effect of clopidogrel by inhibiting CYP2C19.",
    action: "Consider alternative PPI (pantoprazole) or H2 blocker",
  },
  {
    drugs: ["methotrexate", "nsaid"],
    severity: "major",
    description: "NSAIDs can increase methotrexate toxicity by reducing renal clearance.",
    action: "Avoid combination or monitor methotrexate levels closely",
  },
  {
    drugs: ["lithium", "ibuprofen"],
    severity: "major",
    description: "NSAIDs reduce lithium clearance, leading to increased lithium levels and toxicity risk.",
    action: "Monitor lithium levels, consider alternative pain management",
  },
  {
    drugs: ["fluoxetine", "tramadol"],
    severity: "major",
    description: "Risk of serotonin syndrome and increased seizure risk.",
    action: "Avoid combination, consider alternative pain management",
  },
  {
    drugs: ["fluoxetine", "maoi"],
    severity: "contraindicated",
    description: "Severe risk of serotonin syndrome, potentially fatal.",
    action: "Contraindicated combination - do not use together. Wait 5 weeks after stopping fluoxetine before starting MAOI.",
  },
  {
    drugs: ["sertraline", "maoi"],
    severity: "contraindicated",
    description: "Severe risk of serotonin syndrome, potentially fatal.",
    action: "Contraindicated combination - do not use together. Wait 2 weeks after stopping sertraline before starting MAOI.",
  },
  {
    drugs: ["digoxin", "amiodarone"],
    severity: "major",
    description: "Amiodarone increases digoxin levels by reducing renal and non-renal clearance.",
    action: "Reduce digoxin dose by 50% and monitor levels",
  },
  {
    drugs: ["sildenafil", "nitroglycerin"],
    severity: "contraindicated",
    description: "Severe hypotension risk. Both agents cause vasodilation.",
    action: "Do not use within 24-48 hours of each other",
  },
  {
    drugs: ["metronidazole", "alcohol"],
    severity: "major",
    description: "Disulfiram-like reaction: nausea, vomiting, flushing, headache.",
    action: "Avoid alcohol during and 3 days after metronidazole treatment",
  },
  {
    drugs: ["ciprofloxacin", "theophylline"],
    severity: "major",
    description: "Ciprofloxacin inhibits theophylline metabolism, increasing toxicity risk.",
    action: "Monitor theophylline levels, consider dose reduction",
  },
  {
    drugs: ["spironolactone", "potassium"],
    severity: "major",
    description: "Both agents increase potassium, leading to hyperkalemia risk.",
    action: "Avoid potassium supplements unless levels are low",
  },
  {
    drugs: ["atorvastatin", "clarithromycin"],
    severity: "major",
    description: "Clarithromycin inhibits CYP3A4, increasing statin levels and myopathy risk.",
    action: "Consider alternative antibiotic or temporarily hold statin",
  },
];

/**
 * Normalize drug name for comparison
 */
function normalizeDrugName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Check if two drug names might be the same or related
 */
function drugsMatch(drug1: string, drug2: string): boolean {
  const norm1 = normalizeDrugName(drug1);
  const norm2 = normalizeDrugName(drug2);
  
  // Direct match
  if (norm1 === norm2) return true;
  
  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Check for common variants
  const variants: Record<string, string[]> = {
    "ibuprofen": ["advil", "motrin", "nsaid"],
    "naproxen": ["aleve", "nsaid"],
    "aspirin": ["asa", "acetylsalicylic"],
    "acetaminophen": ["tylenol", "paracetamol"],
    "omeprazole": ["prilosec"],
    "esomeprazole": ["nexium"],
    "pantoprazole": ["protonix"],
    "lisinopril": ["ace inhibitor", "acei"],
    "enalapril": ["ace inhibitor", "acei"],
    "losartan": ["arb", "angiotensin receptor blocker"],
    "metformin": ["glucophage"],
    "warfarin": ["coumadin"],
    "clopidogrel": ["plavix"],
    "atorvastatin": ["lipitor", "statin"],
    "simvastatin": ["zocor", "statin"],
    "rosuvastatin": ["crestor", "statin"],
    "fluoxetine": ["prozac", "ssri"],
    "sertraline": ["zoloft", "ssri"],
    "paroxetine": ["paxil", "ssri"],
    "escitalopram": ["lexapro", "ssri"],
    "alprazolam": ["xanax", "benzodiazepine"],
    "lorazepam": ["ativan", "benzodiazepine"],
    "diazepam": ["valium", "benzodiazepine"],
    "hydrocodone": ["opioid", "narcotic"],
    "oxycodone": ["opioid", "narcotic", "percocet"],
    "tramadol": ["ultram"],
    "gabapentin": ["neurontin"],
    "pregabalin": ["lyrica"],
  };
  
  for (const [drug, aliases] of Object.entries(variants)) {
    const allNames = [drug, ...aliases];
    const match1 = allNames.some((name) => norm1.includes(name) || name.includes(norm1));
    const match2 = allNames.some((name) => norm2.includes(name) || name.includes(norm2));
    if (match1 && match2) return true;
  }
  
  return false;
}

/**
 * Search OpenFDA for drug interactions
 * Uses the drug adverse events endpoint to find reported interactions
 */
async function searchOpenFDA(
  medications: string[]
): Promise<DrugInteraction[]> {
  const interactions: DrugInteraction[] = [];
  
  try {
    // Search for adverse events involving the medications
    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const drug1 = medications[i];
        const drug2 = medications[j];
        
        // Query OpenFDA for adverse events involving both drugs
        const query = encodeURIComponent(
          `patient.drug.openfda.generic_name:"${drug1}" AND patient.drug.openfda.generic_name:"${drug2}"`
        );
        
        try {
          const response = await fetch(
            `${OPENFDA_BASE_URL}/event.json?search=${query}&limit=10`,
            { signal: AbortSignal.timeout(5000) }
          );
          
          if (response.ok) {
            const data = await response.json();
            
            // If we found adverse events with both drugs, flag potential interaction
            if (data.results && data.results.length > 0) {
              // Look for serious outcomes
              const seriousEvents = data.results.filter(
                (r: any) => r.serious === 1 || r.seriousnessdeath === 1 || r.seriousnesshospitalization === 1
              );
              
              if (seriousEvents.length > 0) {
                // Extract common reactions
                const reactions = seriousEvents
                  .flatMap((e: any) => e.patient?.reaction || [])
                  .map((r: any) => r.reactionmeddrapt)
                  .filter(Boolean);
                
                const uniqueReactions = [...new Set(reactions)].slice(0, 3);
                
                interactions.push({
                  drug1,
                  drug2,
                  severity: seriousEvents.some((e: any) => e.seriousnessdeath === 1)
                    ? "major"
                    : "moderate",
                  description: `Adverse events reported when used together: ${uniqueReactions.join(", ") || "Various reactions"}`,
                  action: "Review patient for these potential adverse effects",
                });
              }
            }
          }
        } catch (error) {
          // Individual query failed, continue with others
          console.warn(`OpenFDA query failed for ${drug1}/${drug2}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("OpenFDA search error:", error);
  }
  
  return interactions;
}

/**
 * Search RxNav for drug interactions using the interaction API
 */
async function searchRxNav(
  medications: string[]
): Promise<DrugInteraction[]> {
  const interactions: DrugInteraction[] = [];
  
  try {
    // First, get RxCUI for each medication
    const rxcuis: Map<string, string> = new Map();
    
    for (const med of medications) {
      try {
        const response = await fetch(
          `${RXNAV_BASE_URL}/rxcui.json?name=${encodeURIComponent(med)}&search=1`,
          { signal: AbortSignal.timeout(5000) }
        );
        
        if (response.ok) {
          const data = await response.json();
          const rxcui = data.idGroup?.rxnormId?.[0];
          if (rxcui) {
            rxcuis.set(med, rxcui);
          }
        }
      } catch (error) {
        console.warn(`RxNav lookup failed for ${med}:`, error);
      }
    }
    
    // If we have at least 2 RxCUIs, check for interactions
    const rxcuiArray = Array.from(rxcuis.entries());
    if (rxcuiArray.length >= 2) {
      const rxcuiList = rxcuiArray.map(([, rxcui]) => rxcui).join("+");
      
      try {
        const response = await fetch(
          `${RXNAV_BASE_URL}/interaction/list.json?rxcuis=${rxcuiList}`,
          { signal: AbortSignal.timeout(10000) }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Parse interaction groups
          const interactionGroups = data.fullInteractionTypeGroup || [];
          
          for (const group of interactionGroups) {
            const interactionTypes = group.fullInteractionType || [];
            
            for (const type of interactionTypes) {
              const pairs = type.interactionPair || [];
              
              for (const pair of pairs) {
                const concepts = pair.interactionConcept || [];
                if (concepts.length >= 2) {
                  const drug1Name = concepts[0]?.minConceptItem?.name || "Unknown";
                  const drug2Name = concepts[1]?.minConceptItem?.name || "Unknown";
                  const description = pair.description || "Potential interaction";
                  const severity = pair.severity?.toLowerCase() || "moderate";
                  
                  interactions.push({
                    drug1: drug1Name,
                    drug2: drug2Name,
                    severity: severity === "high" ? "major" : severity === "low" ? "minor" : "moderate",
                    description,
                    action: "Review clinical significance and consider alternatives",
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("RxNav interaction check failed:", error);
      }
    }
  } catch (error) {
    console.error("RxNav search error:", error);
  }
  
  return interactions;
}

/**
 * Check for interactions using internal knowledge base
 */
function checkKnownInteractions(
  medications: string[]
): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  const normalizedMeds = medications.map(normalizeDrugName);
  
  for (const known of KNOWN_INTERACTIONS) {
    const [knownDrug1, knownDrug2] = known.drugs;
    
    // Check if both drugs from the known interaction are present
    const hasDrug1 = normalizedMeds.some((med) => drugsMatch(med, knownDrug1));
    const hasDrug2 = normalizedMeds.some((med) => drugsMatch(med, knownDrug2));
    
    if (hasDrug1 && hasDrug2) {
      // Find the actual medication names from the input
      const drug1Match = medications.find((med) => drugsMatch(normalizeDrugName(med), knownDrug1)) || knownDrug1;
      const drug2Match = medications.find((med) => drugsMatch(normalizeDrugName(med), knownDrug2)) || knownDrug2;
      
      interactions.push({
        drug1: drug1Match,
        drug2: drug2Match,
        severity: known.severity,
        description: known.description,
        action: known.action,
      });
    }
  }
  
  return interactions;
}

/**
 * Deduplicate interactions based on drug pairs
 */
function deduplicateInteractions(
  interactions: DrugInteraction[]
): DrugInteraction[] {
  const seen = new Set<string>();
  const unique: DrugInteraction[] = [];
  
  for (const interaction of interactions) {
    // Create a normalized key for the drug pair
    const drugs = [
      normalizeDrugName(interaction.drug1),
      normalizeDrugName(interaction.drug2),
    ].sort();
    const key = drugs.join("|");
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(interaction);
    }
  }
  
  return unique;
}

/**
 * Main drug interaction check function
 * Aggregates results from multiple sources
 */
export async function checkDrugInteractions(
  medications: Array<{ id: string; medication_name: string }>
): Promise<DrugInteractionResult> {
  if (medications.length < 2) {
    return {
      status: "no_major",
      message: "No drug interactions to check (less than 2 medications)",
    };
  }
  
  const medicationNames = medications.map((m) => m.medication_name);
  let allInteractions: DrugInteraction[] = [];
  
  // 1. Check internal knowledge base first (fastest, most reliable for known interactions)
  const knownInteractions = checkKnownInteractions(medicationNames);
  allInteractions.push(...knownInteractions);
  
  // 2. Try RxNav API (NIH-provided, comprehensive)
  try {
    const rxnavInteractions = await searchRxNav(medicationNames);
    allInteractions.push(...rxnavInteractions);
  } catch (error) {
    console.error("RxNav search failed:", error);
  }
  
  // 3. Try OpenFDA (supplementary adverse event data)
  // Only if we don't have enough information from other sources
  if (allInteractions.length === 0) {
    try {
      const openfdaInteractions = await searchOpenFDA(medicationNames);
      allInteractions.push(...openfdaInteractions);
    } catch (error) {
      console.error("OpenFDA search failed:", error);
    }
  }
  
  // Deduplicate results
  const uniqueInteractions = deduplicateInteractions(allInteractions);
  
  // Determine overall status
  let status: DrugInteractionResult["status"] = "no_major";
  let message = "No significant drug interactions detected";
  
  if (uniqueInteractions.some((i) => i.severity === "contraindicated")) {
    status = "critical";
    message = "Critical drug interaction detected - contraindicated combination";
  } else if (uniqueInteractions.some((i) => i.severity === "major")) {
    status = "major";
    message = `${uniqueInteractions.filter((i) => i.severity === "major").length} major drug interaction(s) detected`;
  } else if (uniqueInteractions.some((i) => i.severity === "moderate")) {
    status = "minor";
    message = `${uniqueInteractions.length} moderate drug interaction(s) detected`;
  } else if (uniqueInteractions.some((i) => i.severity === "minor")) {
    status = "minor";
    message = `${uniqueInteractions.length} minor drug interaction(s) detected`;
  }
  
  return {
    status,
    message,
    interactions: uniqueInteractions.length > 0 ? uniqueInteractions : undefined,
  };
}

/**
 * Check interactions for a specific drug against a list of existing medications
 */
export async function checkNewDrugInteraction(
  newDrug: string,
  existingMedications: string[]
): Promise<DrugInteraction[]> {
  const allMeds = [newDrug, ...existingMedications];
  const result = await checkDrugInteractions(
    allMeds.map((med, idx) => ({ id: `temp-${idx}`, medication_name: med }))
  );
  
  // Filter to only return interactions involving the new drug
  return (result.interactions || []).filter(
    (i) =>
      drugsMatch(i.drug1, newDrug) || drugsMatch(i.drug2, newDrug)
  );
}
