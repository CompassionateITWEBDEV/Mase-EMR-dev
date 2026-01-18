"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import useSWR from "swr"
import {
  Stethoscope,
  Plus,
  Search,
  Calendar,
  User,
  Clock,
  Edit3,
  Save,
  Mic,
  MicOff,
  Brain,
  FileText,
  Sparkles,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Activity,
  Heart,
  ScanFace,
  Baby,
  Zap,
  Package,
  Beaker,
  MessageSquare,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const noteTemplates = [
  {
    id: "soap",
    name: "SOAP Note",
    description: "Subjective, Objective, Assessment, Plan",
    icon: FileText,
    color: "bg-blue-500",
  },
  {
    id: "progress",
    name: "Progress Note",
    description: "Session progress and observations",
    icon: Clock,
    color: "bg-green-500",
  },
  {
    id: "intake",
    name: "Intake Note",
    description: "Initial patient evaluation",
    icon: User,
    color: "bg-purple-500",
  },
  {
    id: "discharge",
    name: "Discharge Summary",
    description: "Treatment completion summary",
    icon: Stethoscope,
    color: "bg-orange-500",
  },
  {
    id: "podiatry",
    name: "Podiatry Visit",
    description: "Foot and ankle examination",
    icon: Activity,
    color: "bg-pink-500",
  },
  {
    id: "obgyn",
    name: "OB/GYN Visit",
    description: "Women's health examination",
    icon: Heart,
    color: "bg-rose-500",
  },
  {
    id: "psychiatry",
    name: "Psychiatric Evaluation",
    description: "Mental status and medication review",
    icon: Brain,
    color: "bg-indigo-500",
  },
  {
    id: "cardiology",
    name: "Cardiology Assessment",
    description: "Cardiac evaluation and testing",
    icon: Activity,
    color: "bg-red-500",
  },
  {
    id: "dermatology",
    name: "Dermatology Exam",
    description: "Skin, hair, and nail assessment",
    icon: ScanFace,
    color: "bg-amber-500",
  },
  {
    id: "pediatrics",
    name: "Pediatric Well Visit",
    description: "Child health and development",
    icon: Baby,
    color: "bg-teal-500",
  },
  {
    id: "urgent-care",
    name: "Urgent Care Visit",
    description: "Acute illness or injury",
    icon: Zap,
    color: "bg-yellow-500",
  },
  {
    id: "physical-therapy",
    name: "Physical Therapy Visit",
    description: "PT evaluation and treatment session",
    icon: Activity,
    color: "bg-cyan-500",
  },
  {
    id: "occupational-therapy",
    name: "Occupational Therapy Visit",
    description: "OT evaluation and ADL training",
    icon: Heart,
    color: "bg-lime-500",
  },
  {
    id: "speech-therapy",
    name: "Speech Therapy Visit",
    description: "SLP assessment and treatment",
    icon: MessageSquare,
    color: "bg-violet-500",
  },
  {
    id: "dme-order",
    name: "DME Order Note",
    description: "Durable medical equipment prescription",
    icon: Package,
    color: "bg-sky-500",
  },
  {
    id: "toxicology",
    name: "Drug Screen Order",
    description: "Toxicology specimen collection",
    icon: Beaker,
    color: "bg-emerald-500",
  },
]

const templateContent: Record<string, string> = {
  soap: `SUBJECTIVE:
[Patient's chief complaint, symptoms, history]

OBJECTIVE:
[Vital signs, physical exam findings, lab results]

ASSESSMENT:
[Clinical impression, diagnosis codes]

PLAN:
[Treatment plan, medications, follow-up]`,

  progress: `SESSION DATE: ${new Date().toLocaleDateString()}
DURATION: [minutes]

PROGRESS SINCE LAST VISIT:
[Patient's progress toward goals]

TODAY'S SESSION:
[Activities and interventions]

PATIENT RESPONSE:
[Observations]

PLAN FOR NEXT SESSION:
[Continuation of treatment]`,

  intake: `INTAKE ASSESSMENT
Date: ${new Date().toLocaleDateString()}

PRESENTING PROBLEM:
[Chief complaint and history]

MEDICAL HISTORY:
[Relevant medical conditions]

MENTAL HEALTH HISTORY:
[Prior treatment, diagnoses]

SUBSTANCE USE HISTORY:
[Current and past use]

ASSESSMENT:
[Clinical impressions]

TREATMENT PLAN:
[Recommended interventions]`,

  discharge: `DISCHARGE SUMMARY
Date: ${new Date().toLocaleDateString()}

ADMISSION DATE:
[Date]

LENGTH OF STAY:
[Days/weeks]

DISCHARGE DIAGNOSIS:
[ICD-10 codes]

TREATMENT PROVIDED:
[Summary of care]

DISCHARGE STATUS:
[Completed successfully / Against medical advice / etc.]

FOLLOW-UP PLAN:
[Continuing care recommendations]`,

  podiatry: `PODIATRY EXAMINATION
Date: ${new Date().toLocaleDateString()}

CHIEF COMPLAINT:
[Foot/ankle concern]

VASCULAR ASSESSMENT:
- Pedal pulses: [DP/PT present bilaterally]
- Capillary refill: [<3 seconds]
- ABI (if performed): [value]

NEUROLOGICAL EXAM:
- Monofilament test: [intact/diminished]
- Vibration sense: [present/absent]
- Proprioception: [intact]

DERMATOLOGICAL EXAM:
- Skin integrity: [intact/lesions noted]
- Nail condition: [normal/fungal/ingrown]
- Calluses/corns: [location]

BIOMECHANICAL ASSESSMENT:
- Gait: [normal/antalgic]
- Foot type: [neutral/pronated/supinated]
- ROM: [ankle DF/PF, subtalar motion]

DIAGNOSIS:
[ICD-10 codes]

TREATMENT PLAN:
[Debridement/orthotics/medications/follow-up]`,

  obgyn: `OB/GYN VISIT
Date: ${new Date().toLocaleDateString()}

REASON FOR VISIT:
[Annual exam / prenatal visit / concern]

LMP: [date]
GRAVIDA/PARA: [G_P_]

OBSTETRIC HISTORY:
[Prior pregnancies and outcomes]

GYNECOLOGIC HISTORY:
[Menstrual history, contraception]

EXAM:
- Breast: [normal/findings]
- Abdomen: [soft, non-tender]
- Pelvic: [normal/findings]
- Cervix: [visual inspection]

LABS/STUDIES:
[Pap smear, STI screening, ultrasound]

ASSESSMENT & PLAN:
[Diagnosis and recommendations]`,

  psychiatry: `PSYCHIATRIC EVALUATION
Date: ${new Date().toLocaleDateString()}

CHIEF COMPLAINT:
[Patient's stated concern]

HISTORY OF PRESENT ILLNESS:
[Timeline and symptoms]

MENTAL STATUS EXAM:
- Appearance: [well-groomed, appropriate dress]
- Behavior: [cooperative, good eye contact]
- Speech: [normal rate and tone]
- Mood: [patient's stated mood]
- Affect: [observed affect - full/restricted/flat]
- Thought Process: [linear, goal-directed]
- Thought Content: [no SI/HI, no delusions]
- Perception: [no hallucinations]
- Cognition: [alert and oriented x3]
- Insight: [good/fair/poor]
- Judgment: [intact]

DIAGNOSIS:
[DSM-5 diagnosis with code]

MEDICATIONS:
[Current psychiatric medications]

PLAN:
[Medication management, therapy referral, follow-up]`,

  cardiology: `CARDIOLOGY ASSESSMENT
Date: ${new Date().toLocaleDateString()}

CHIEF COMPLAINT:
[Chest pain, SOB, palpitations, etc.]

CARDIAC HISTORY:
[Prior MI, stents, CABG, arrhythmias]

RISK FACTORS:
- HTN: [Y/N, controlled]
- DM: [Y/N, HbA1c]
- Smoking: [Y/N, pack-years]
- Cholesterol: [levels]
- Family history: [premature CAD]

CARDIOVASCULAR EXAM:
- Heart rate: [bpm, regular/irregular]
- BP: [systolic/diastolic]
- Heart sounds: [S1/S2, murmurs]
- JVP: [elevated/normal]
- Peripheral edema: [present/absent]
- Peripheral pulses: [2+/4+ bilaterally]

DIAGNOSTIC TESTS:
- ECG: [interpretation]
- Echo: [EF, valves, wall motion]
- Stress test: [results]
- Cardiac cath: [findings]

DIAGNOSIS:
[ICD-10 codes]

PLAN:
[Medications, lifestyle modifications, procedures, follow-up]`,

  dermatology: `DERMATOLOGY EXAM
Date: ${new Date().toLocaleDateString()}

CHIEF COMPLAINT:
[Rash, lesion, skin concern]

SKIN EXAM:
- Location: [anatomical site]
- Distribution: [localized/diffuse, symmetric/asymmetric]
- Primary lesion: [macule/papule/nodule/plaque/vesicle/bulla]
- Color: [erythematous, hyperpigmented, etc.]
- Size: [mm or cm]
- Borders: [well-defined/irregular]
- Texture: [smooth/scaly/crusted]

DERMOSCOPY (if performed):
[Findings]

PHOTOGRAPHY:
[Photos taken for medical record]

PROCEDURES PERFORMED:
[Biopsy, cryotherapy, excision, etc.]

DIAGNOSIS:
[ICD-10 codes]

TREATMENT PLAN:
[Topical medications, systemic therapy, follow-up biopsy results]`,

  pediatrics: `PEDIATRIC WELL VISIT
Date: ${new Date().toLocaleDateString()}
Age: [months/years]

GROWTH PARAMETERS:
- Weight: [kg/lb] ([percentile])
- Height: [cm/in] ([percentile])
- Head circumference (if <2yo): [cm] ([percentile])
- BMI: [value] ([percentile])

DEVELOPMENTAL MILESTONES:
[Age-appropriate milestones achieved]

IMMUNIZATIONS:
[Vaccines administered today]

PHYSICAL EXAM:
- General: [well-appearing, alert]
- HEENT: [normocephalic, TMs clear]
- Cardiovascular: [RRR, no murmur]
- Respiratory: [CTAB]
- Abdomen: [soft, non-tender]
- Extremities: [no deformities]
- Neuro: [age-appropriate]

NUTRITION:
[Breastfeeding/formula/solid foods, dietary counseling]

ANTICIPATORY GUIDANCE:
[Safety, sleep, development discussed]

PLAN:
[Follow-up, referrals if needed]`,

  "urgent-care": `URGENT CARE VISIT
Date: ${new Date().toLocaleDateString()}

CHIEF COMPLAINT:
[Brief description]

HISTORY OF PRESENT ILLNESS:
[Onset, duration, severity, associated symptoms]

PERTINENT MEDICAL HISTORY:
[Relevant chronic conditions, medications, allergies]

PHYSICAL EXAM:
- Vitals: BP [__], HR [__], RR [__], Temp [__], SpO2 [__]
- General: [appearance]
- Focused exam based on complaint

DIAGNOSTIC TESTS:
[X-rays, rapid strep, flu test, urinalysis, etc.]

DIAGNOSIS:
[ICD-10 codes]

TREATMENT:
[Medications prescribed, procedures performed]

WORK/SCHOOL EXCUSE:
[If applicable]

DISPOSITION:
[Discharged home, follow up with PCP, ED referral if needed]

DISCHARGE INSTRUCTIONS:
[Care instructions, return precautions]`,

  "physical-therapy": `PHYSICAL THERAPY VISIT
Date: ${new Date().toLocaleDateString()}
Visit Type: [Initial Evaluation / Re-evaluation / Treatment Session]

CHIEF COMPLAINT:
[Patient's primary functional limitation]

HISTORY:
[Mechanism of injury, onset, prior treatment]

PAIN ASSESSMENT:
- Current pain: [0-10 scale]
- Location: [body diagram]
- Aggravating factors: [activities]
- Relieving factors: [rest, ice, etc.]

OBJECTIVE MEASUREMENTS:
ROM (Active/Passive):
- [Joint]: [degrees] / [degrees]

STRENGTH (Manual Muscle Test 0-5):
- [Muscle group]: [grade]/5

FUNCTIONAL TESTS:
- [Balance, gait speed, timed up-and-go, etc.]

ASSESSMENT:
[Clinical impression, prognosis]

TREATMENT PROVIDED TODAY:
- Therapeutic Exercise (97110): [exercises performed]
- Manual Therapy (97140): [techniques]
- Therapeutic Activities (97530): [functional training]
- Modalities: [ultrasound, e-stim, ice/heat]

HOME EXERCISE PROGRAM:
[Exercises assigned with sets/reps]

SHORT-TERM GOALS (2-4 weeks):
[Specific, measurable goals]

LONG-TERM GOALS (discharge):
[Functional outcomes]

PLAN:
[Frequency: __x/week for __ weeks]
[Next visit focus]

CPT CODES: 97110, 97140, 97530 (as applicable)`,

  "occupational-therapy": `OCCUPATIONAL THERAPY VISIT
Date: ${new Date().toLocaleDateString()}
Visit Type: [Initial Evaluation / Re-evaluation / Treatment Session]

REASON FOR REFERRAL:
[Functional deficits requiring OT intervention]

OCCUPATIONAL PROFILE:
- Living situation: [home, assisted living, etc.]
- Prior level of function: [independent/modified independent/dependent]
- Valued occupations: [work, hobbies, self-care]

ADL ASSESSMENT:
- Bathing: [I/S/D]
- Dressing: [I/S/D]
- Toileting: [I/S/D]
- Grooming: [I/S/D]
- Feeding: [I/S/D]

IADL ASSESSMENT:
- Meal prep: [I/S/D]
- Laundry: [I/S/D]
- Medication management: [I/S/D]
- Financial management: [I/S/D]

COGNITIVE ASSESSMENT (if applicable):
- Attention: [intact/impaired]
- Memory: [intact/impaired]
- Problem-solving: [intact/impaired]
- Safety awareness: [intact/impaired]

HAND FUNCTION (if applicable):
- Grip strength: [kg] (R/L)
- Pinch strength: [kg] (R/L)
- ROM: [measurements]
- Edema: [present/absent]

TREATMENT PROVIDED TODAY:
- ADL Training (97535): [activities practiced]
- Cognitive Skills (97127): [interventions]
- Therapeutic Activities (97530): [functional tasks]

ADAPTIVE EQUIPMENT RECOMMENDATIONS:
[Reachers, sock aids, tub bench, etc.]

GOALS:
Short-term: [2-4 weeks]
Long-term: [discharge goals]

PLAN:
[Frequency and duration]

CPT CODES: 97165/97166/97167 (eval), 97535, 97530, 97127`,

  "speech-therapy": `SPEECH-LANGUAGE PATHOLOGY VISIT
Date: ${new Date().toLocaleDateString()}
Visit Type: [Initial Evaluation / Re-evaluation / Treatment Session]

REASON FOR REFERRAL:
[Communication/swallowing concern]

COMMUNICATION ASSESSMENT:
Speech Intelligibility: [%]
- Articulation: [errors noted]
- Phonology: [patterns]
- Fluency: [stuttering behaviors]

LANGUAGE:
- Receptive: [following commands, comprehension]
- Expressive: [vocabulary, sentence structure, word-finding]

VOICE:
- Quality: [normal/hoarse/breathy]
- Pitch: [appropriate/abnormal]
- Loudness: [adequate/reduced]

SWALLOWING ASSESSMENT (if applicable):
- Oral phase: [intact/impaired]
- Pharyngeal phase: [intact/impaired - based on clinical signs]
- Diet texture: [regular/modified]
- Liquid consistency: [thin/nectar/honey/pudding]
- Signs of aspiration: [cough, wet voice, etc.]

COGNITIVE-COMMUNICATION:
- Attention: [intact/impaired]
- Memory: [intact/impaired]
- Problem-solving: [intact/impaired]

STANDARDIZED TESTING:
[Test names and scores]

TREATMENT PROVIDED TODAY:
- Therapeutic Services (92507): [articulation drills, language stimulation]
- Swallowing Treatment (92526): [compensatory strategies, exercises]
- Oral Function Assessment (92610): [if applicable]

GOALS:
Short-term: [2-4 weeks]
Long-term: [discharge criteria]

PLAN:
[Frequency: __x/week for __ weeks]

CPT CODES: 92507, 92526, 92610 (as applicable)`,

  "dme-order": `DME ORDER NOTE
Date: ${new Date().toLocaleDateString()}

PATIENT DIAGNOSIS:
[ICD-10 codes requiring DME]

DME REQUESTED:
[Wheelchair, walker, hospital bed, nebulizer, oxygen, etc.]

MEDICAL NECESSITY:
[Clinical justification for DME - why patient needs this equipment]

FUNCTIONAL LIMITATIONS:
[Describe patient's current functional status and limitations]

ALTERNATIVES CONSIDERED:
[Other treatment options and why DME is most appropriate]

DURATION OF NEED:
[Expected length of DME use - months or lifetime]

SPECIFICATIONS:
[Model, size, weight capacity, special features]

PRIOR AUTHORIZATION:
Insurance: [plan name]
Auth #: [if obtained]
Status: [pending/approved/denied]

SUPPLIER:
[Preferred DME supplier name and contact]

DELIVERY/PICKUP INSTRUCTIONS:
[Home delivery, patient training requirements]

HCPCS CODES:
[E-codes, L-codes as applicable]

FOLLOW-UP:
[When to reassess DME needs]`,

  toxicology: `DRUG SCREEN ORDER
Date: ${new Date().toLocaleDateString()}

REASON FOR TEST:
[Routine monitoring / suspected use / treatment compliance]

SPECIMEN TYPE:
[Urine / oral fluid / blood / hair]

TEST PANEL REQUESTED:
- Routine: [Amphetamines, Opiates, Cocaine, THC, Benzodiazepines]
- Extended: [Fentanyl, Buprenorphine, Methadone, Barbiturates]
- Confirmatory: [GC/MS if presumptive positive]

MEDICATIONS PATIENT IS PRESCRIBED:
[List to compare against results]

COLLECTION METHOD:
[Observed / unobserved]
Chain of custody: [Yes/No]

LAB:
[Lab name and account #]

SPECIMEN ID:
[Unique identifier]

CLINICAL NOTES:
[Patient presentation, compliance concerns]

RESULTS EXPECTED:
[Date]

FOLLOW-UP PLAN:
[What will be done with results - counseling, dose adjustment, etc.]`,
}

export default function ClinicalNotesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [currentNote, setCurrentNote] = useState("")
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedNoteType, setSelectedNoteType] = useState("progress")
  const [aiAction, setAiAction] = useState<string | null>(null)
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false)

  const { data, error, isLoading, mutate } = useSWR("/api/clinical-notes", fetcher)
  const { data: patientsData } = useSWR("/api/patients", fetcher)

  const handleAiAssist = useCallback(
    async (action: string) => {
      if (!currentNote.trim()) {
        toast.error("Please enter some note content first")
        return
      }
      setAiAction(action)
      setShowAiDialog(true)
      try {
        const response = await fetch("/api/clinical-notes/ai-assist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            noteContent: currentNote,
            noteType: selectedNoteType,
            action,
          }),
        })
        const result = await response.json()
        if (result.completion) {
          setCurrentNote(result.completion)
          toast.success("AI enhancement applied")
        }
      } catch (err) {
        toast.error("AI assist failed")
      }
      setShowAiDialog(false)
    },
    [currentNote, selectedNoteType],
  )

  const handleSaveNote = async () => {
    if (!selectedPatient || !currentNote.trim()) {
      toast.error("Please select a patient and enter note content")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/clinical-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient,
          note_type: selectedNoteType,
          subjective: currentNote,
          objective: "",
          assessment: "",
          plan: "",
        }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        toast.success("Note saved successfully")
        setCurrentNote("")
        setSelectedPatient("")
        mutate()
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        toast.error("Failed to save note")
      }
    } catch (err) {
      console.error("Save error:", err)
      toast.error("Failed to save note")
    } finally {
      setSaving(false)
    }
  }

  const handleSelectTemplate = (templateId: string) => {
    setSelectedNoteType(templateId)
    const content = templateContent[templateId] || ""
    setCurrentNote(content)
    setActiveTab("editor")
    toast.success(`${noteTemplates.find((t) => t.id === templateId)?.name} template loaded`)
  }

  const handleNewNote = () => {
    setShowNewNoteDialog(true)
  }

  const startNewNote = (templateId: string) => {
    setSelectedNoteType(templateId)
    setCurrentNote(templateContent[templateId] || "")
    setSelectedPatient("")
    setShowNewNoteDialog(false)
    setActiveTab("editor")
    toast.success("New note started - select a patient and begin documenting")
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      draft: "secondary",
      pending: "outline",
    } as const
    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>
  }

  const notes = data?.notes || []
  const patients = patientsData?.patients || []

  const filteredNotes = notes.filter(
    (note: any) =>
      note.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.note_type?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Clinical Notes</h1>
              <p className="text-muted-foreground mt-2">AI-assisted clinical documentation and note-taking</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => mutate()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={handleNewNote}>
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Note Templates and Quick Actions */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Note Templates</CardTitle>
                  <CardDescription>Quick start with AI-powered templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {noteTemplates.map((template) => {
                    const IconComponent = template.icon
                    return (
                      <Button
                        key={template.id}
                        variant={selectedNoteType === template.id ? "default" : "outline"}
                        className={`w-full justify-start h-auto p-4 ${selectedNoteType === template.id ? "" : "bg-transparent"}`}
                        onClick={() => handleSelectTemplate(template.id)}
                      >
                        <div className={`p-2 rounded-lg ${template.color} mr-3`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Voice Recording</CardTitle>
                  <CardDescription>AI-powered transcription and note generation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    className="w-full"
                    onClick={() => {
                      setIsRecording(!isRecording)
                      if (!isRecording) {
                        toast.info("Voice recording started - speak clearly")
                      } else {
                        toast.success("Recording stopped - processing...")
                      }
                    }}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="mr-2 h-4 w-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  {isRecording && (
                    <div className="text-center">
                      <div className="animate-pulse text-red-500 text-sm">● Recording in progress...</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        AI is listening and will generate notes automatically
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Actions</CardTitle>
                  <CardDescription>Enhance your documentation with AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => handleAiAssist("enhance")}
                    disabled={!currentNote.trim()}
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                    Enhance Note
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => handleAiAssist("soap")}
                    disabled={!currentNote.trim()}
                  >
                    <FileText className="mr-2 h-4 w-4 text-blue-500" />
                    Convert to SOAP
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => handleAiAssist("suggestions")}
                    disabled={!currentNote.trim()}
                  >
                    <Brain className="mr-2 h-4 w-4 text-purple-500" />
                    Get Suggestions
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => handleAiAssist("summarize")}
                    disabled={!currentNote.trim()}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Summarize
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main Note Editor and Recent Notes */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="w-full md:w-auto">
                  <TabsTrigger value="editor">Note Editor</TabsTrigger>
                  <TabsTrigger value="recent">Recent Notes ({notes.length})</TabsTrigger>
                  <TabsTrigger value="templates">My Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="editor">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle>Clinical Note Editor</CardTitle>
                          <CardDescription>AI-assisted documentation with real-time suggestions</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAiAssist("enhance")}
                            disabled={!currentNote.trim()}
                          >
                            <Brain className="mr-2 h-4 w-4" />
                            AI Assist
                          </Button>
                          <Button size="sm" onClick={handleSaveNote} disabled={saving || !selectedPatient}>
                            {saving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : saveSuccess ? (
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            {saveSuccess ? "Saved!" : "Save"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Patient</label>
                          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select patient..." />
                            </SelectTrigger>
                            <SelectContent>
                              {patients.map((patient: any) => (
                                <SelectItem key={patient.id} value={patient.id}>
                                  {patient.first_name} {patient.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Note Type</label>
                          <Select value={selectedNoteType} onValueChange={setSelectedNoteType}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select note type..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="soap">SOAP Note</SelectItem>
                              <SelectItem value="progress">Progress Note</SelectItem>
                              <SelectItem value="intake">Intake Note</SelectItem>
                              <SelectItem value="discharge">Discharge Summary</SelectItem>
                              <SelectItem value="podiatry">Podiatry Visit</SelectItem>
                              <SelectItem value="obgyn">OB/GYN Visit</SelectItem>
                              <SelectItem value="psychiatry">Psychiatric Evaluation</SelectItem>
                              <SelectItem value="cardiology">Cardiology Assessment</SelectItem>
                              <SelectItem value="dermatology">Dermatology Exam</SelectItem>
                              <SelectItem value="pediatrics">Pediatric Well Visit</SelectItem>
                              <SelectItem value="urgent-care">Urgent Care Visit</SelectItem>
                              <SelectItem value="physical-therapy">Physical Therapy Visit</SelectItem>
                              <SelectItem value="occupational-therapy">Occupational Therapy Visit</SelectItem>
                              <SelectItem value="speech-therapy">Speech Therapy Visit</SelectItem>
                              <SelectItem value="dme-order">DME Order Note</SelectItem>
                              <SelectItem value="toxicology">Drug Screen Order</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Clinical Note</label>
                        <Textarea
                          placeholder="Start typing your clinical note or select a template from the left panel..."
                          value={currentNote}
                          onChange={(e) => setCurrentNote(e.target.value)}
                          className="min-h-[300px] mt-2 font-mono text-sm"
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{currentNote ? "Edit your note content" : "Select a template or start typing"}</span>
                        <span>{currentNote.length} characters</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recent">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <CardTitle>Recent Clinical Notes</CardTitle>
                          <CardDescription>Your latest documentation entries from database</CardDescription>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search notes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full md:w-64"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      ) : error ? (
                        <div className="text-center py-8">
                          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                          <p className="text-muted-foreground">Failed to load notes</p>
                          <Button variant="outline" onClick={() => mutate()} className="mt-4">
                            Try Again
                          </Button>
                        </div>
                      ) : filteredNotes.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No Notes Found</h3>
                          <p className="text-muted-foreground">
                            {searchTerm
                              ? "No notes match your search"
                              : "Create your first clinical note to get started"}
                          </p>
                          <Button className="mt-4" onClick={handleNewNote}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create First Note
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredNotes.map((note: any) => (
                            <div
                              key={note.id}
                              className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-medium capitalize">
                                    {note.note_type?.replace("_", " ") || "Progress Note"}
                                  </h4>
                                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{note.patient_name}</span>
                                    <span>•</span>
                                    <span>{note.provider_name}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-sm text-muted-foreground">
                                  <Calendar className="inline h-3 w-3 mr-1" />
                                  {new Date(note.created_at).toLocaleDateString()}
                                </div>
                                {getStatusBadge(note.status)}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentNote(note.subjective || "")
                                    setSelectedNoteType(note.note_type || "progress")
                                    setActiveTab("editor")
                                    toast.info("Note loaded for editing")
                                  }}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="templates">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Templates</CardTitle>
                      <CardDescription>Custom note templates for quick documentation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {noteTemplates.map((template) => {
                          const IconComponent = template.icon
                          return (
                            <Card
                              key={template.id}
                              className="cursor-pointer hover:border-primary transition-colors"
                              onClick={() => handleSelectTemplate(template.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className={`p-3 rounded-lg ${template.color}`}>
                                    <IconComponent className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{template.name}</h4>
                                    <p className="text-sm text-muted-foreground">{template.description}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showNewNoteDialog} onOpenChange={setShowNewNoteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>Select a template to start your clinical note</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {noteTemplates.map((template) => {
              const IconComponent = template.icon
              return (
                <Button
                  key={template.id}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 bg-transparent"
                  onClick={() => startNewNote(template.id)}
                >
                  <div className={`p-2 rounded-lg ${template.color} mr-3`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewNoteDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Processing Dialog */}
      <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Processing</DialogTitle>
            <DialogDescription>
              {aiAction === "enhance" && "Enhancing your clinical note with AI..."}
              {aiAction === "soap" && "Converting to SOAP format..."}
              {aiAction === "suggestions" && "Generating suggestions..."}
              {aiAction === "summarize" && "Creating summary..."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
