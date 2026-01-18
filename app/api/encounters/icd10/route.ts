import { NextResponse } from "next/server"

// Common ICD-10 codes for primary care / behavioral health
const ICD10_CODES = [
  // Substance Use Disorders
  { code: "F11.10", description: "Opioid use disorder, uncomplicated" },
  { code: "F11.20", description: "Opioid dependence, uncomplicated" },
  { code: "F11.21", description: "Opioid dependence, in remission" },
  { code: "F11.23", description: "Opioid dependence with withdrawal" },
  { code: "F10.10", description: "Alcohol use disorder, uncomplicated" },
  { code: "F10.20", description: "Alcohol dependence, uncomplicated" },
  { code: "F10.21", description: "Alcohol dependence, in remission" },
  { code: "F14.10", description: "Cocaine use disorder, uncomplicated" },
  { code: "F14.20", description: "Cocaine dependence, uncomplicated" },
  { code: "F15.10", description: "Stimulant use disorder, uncomplicated" },
  { code: "F12.10", description: "Cannabis use disorder, uncomplicated" },
  { code: "F19.10", description: "Other psychoactive substance use disorder" },

  // Mental Health
  { code: "F32.0", description: "Major depressive disorder, single episode, mild" },
  { code: "F32.1", description: "Major depressive disorder, single episode, moderate" },
  { code: "F32.2", description: "Major depressive disorder, single episode, severe" },
  { code: "F33.0", description: "Major depressive disorder, recurrent, mild" },
  { code: "F33.1", description: "Major depressive disorder, recurrent, moderate" },
  { code: "F33.2", description: "Major depressive disorder, recurrent, severe" },
  { code: "F41.0", description: "Panic disorder" },
  { code: "F41.1", description: "Generalized anxiety disorder" },
  { code: "F41.9", description: "Anxiety disorder, unspecified" },
  { code: "F43.10", description: "Post-traumatic stress disorder, unspecified" },
  { code: "F43.11", description: "Post-traumatic stress disorder, acute" },
  { code: "F43.12", description: "Post-traumatic stress disorder, chronic" },
  { code: "F31.0", description: "Bipolar disorder, current episode hypomanic" },
  { code: "F31.9", description: "Bipolar disorder, unspecified" },
  { code: "F20.9", description: "Schizophrenia, unspecified" },
  { code: "F60.3", description: "Borderline personality disorder" },
  { code: "F90.0", description: "ADHD, predominantly inattentive type" },
  { code: "F90.1", description: "ADHD, predominantly hyperactive type" },
  { code: "F90.2", description: "ADHD, combined type" },
  { code: "F50.00", description: "Anorexia nervosa, unspecified" },
  { code: "F50.2", description: "Bulimia nervosa" },

  // Primary Care - Chronic Conditions
  { code: "I10", description: "Essential (primary) hypertension" },
  { code: "E11.9", description: "Type 2 diabetes mellitus without complications" },
  { code: "E11.65", description: "Type 2 diabetes mellitus with hyperglycemia" },
  { code: "E78.5", description: "Hyperlipidemia, unspecified" },
  { code: "E78.0", description: "Pure hypercholesterolemia" },
  { code: "J45.20", description: "Mild intermittent asthma, uncomplicated" },
  { code: "J45.30", description: "Mild persistent asthma, uncomplicated" },
  { code: "J44.9", description: "Chronic obstructive pulmonary disease, unspecified" },
  { code: "K21.0", description: "Gastro-esophageal reflux disease with esophagitis" },
  { code: "M54.5", description: "Low back pain" },
  { code: "M54.2", description: "Cervicalgia (neck pain)" },
  { code: "G43.909", description: "Migraine, unspecified, not intractable" },
  { code: "E66.9", description: "Obesity, unspecified" },
  { code: "E66.01", description: "Morbid (severe) obesity due to excess calories" },
  { code: "N39.0", description: "Urinary tract infection, site not specified" },
  { code: "J06.9", description: "Acute upper respiratory infection, unspecified" },
  { code: "J02.9", description: "Acute pharyngitis, unspecified" },
  { code: "J00", description: "Acute nasopharyngitis (common cold)" },
  { code: "R05", description: "Cough" },
  { code: "R51", description: "Headache" },

  // Preventive / Wellness
  { code: "Z00.00", description: "Encounter for general adult medical exam without abnormal findings" },
  { code: "Z00.01", description: "Encounter for general adult medical exam with abnormal findings" },
  { code: "Z23", description: "Encounter for immunization" },
  { code: "Z71.3", description: "Dietary counseling and surveillance" },
  { code: "Z71.82", description: "Exercise counseling" },
  { code: "Z87.891", description: "Personal history of nicotine dependence" },

  // Pain Management
  { code: "G89.29", description: "Other chronic pain" },
  { code: "G89.4", description: "Chronic pain syndrome" },
  { code: "M79.3", description: "Panniculitis, unspecified" },
  { code: "R52", description: "Pain, unspecified" },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.toLowerCase() || ""

  let filteredCodes = ICD10_CODES

  if (query) {
    filteredCodes = ICD10_CODES.filter(
      (code) => code.code.toLowerCase().includes(query) || code.description.toLowerCase().includes(query),
    )
  }

  return NextResponse.json(filteredCodes.slice(0, 20))
}
