import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface EncounterData {
  encounter: {
    id: string
    appointment_date: string
    appointment_type: string
    status: string
    notes?: string
    patients?: {
      first_name: string
      last_name: string
      date_of_birth?: string
      gender?: string
      phone?: string
      email?: string
      address?: string
    }
    providers?: {
      first_name: string
      last_name: string
      specialization?: string
    }
  }
  encounterNote?: {
    subjective?: string
    objective?: string
    assessment?: string
    plan?: string
  } | null
  vitals?: Array<{
    systolic_bp?: number
    diastolic_bp?: number
    heart_rate?: number
    respiratory_rate?: number
    temperature?: number
    temperature_unit?: string
    oxygen_saturation?: number
    weight?: number
    weight_unit?: string
    height_feet?: number
    height_inches?: number
    bmi?: number
    pain_scale?: number
    pain_location?: string
    measurement_date?: string
  }>
  medications?: Array<{
    medication_name: string
    dosage: string
    frequency: string
    route: string
  }>
  assessments?: Array<{
    diagnosis_codes?: string[]
    assessment_type?: string
    chief_complaint?: string
    history_present_illness?: string
    treatment_plan?: string
  }>
}

export function generateEncounterPDF(data: EncounterData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
      return true
    }
    return false
  }

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  // Helper function to format datetime
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  // Helper function to add section header
  const addSectionHeader = (title: string) => {
    checkPageBreak(15)
    yPosition += 8
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(40, 40, 40)
    doc.text(title, margin, yPosition)
    yPosition += 2
    doc.setLineWidth(0.5)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 5
  }

  // Helper function to add text with wrapping
  const addWrappedText = (text: string, maxWidth: number, fontSize: number = 10) => {
    doc.setFontSize(fontSize)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(60, 60, 60)
    const lines = doc.splitTextToSize(text || "N/A", maxWidth)
    lines.forEach((line: string) => {
      checkPageBreak(6)
      doc.text(line, margin, yPosition)
      yPosition += 6
    })
    yPosition += 2
  }

  // Header
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(30, 30, 30)
  doc.text("MASE EMR - Patient Encounter Report", margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, margin, yPosition)
  yPosition += 10

  // Patient Information Section
  addSectionHeader("Patient Information")
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(60, 60, 60)

  const patient = data.encounter.patients
  const patientName = patient
    ? `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "Unknown Patient"
    : "Unknown Patient"

  const patientInfo = [
    ["Name:", patientName],
    ["Date of Birth:", patient?.date_of_birth ? formatDate(patient.date_of_birth) : "N/A"],
    ["Gender:", patient?.gender || "N/A"],
    ["Phone:", patient?.phone || "N/A"],
  ]

  patientInfo.forEach(([label, value]) => {
    checkPageBreak(7)
    doc.setFont("helvetica", "bold")
    doc.text(label, margin, yPosition)
    doc.setFont("helvetica", "normal")
    const textWidth = doc.getTextWidth(value)
    doc.text(value, margin + 40, yPosition)
    yPosition += 7
  })

  // Encounter Information Section
  addSectionHeader("Encounter Information")

  const encounter = data.encounter
  const provider = encounter.providers
  const providerName = provider
    ? `Dr. ${provider.first_name || ""} ${provider.last_name || ""}`.trim()
    : "Unknown Provider"

  const encounterInfo = [
    ["Date/Time:", formatDateTime(encounter.appointment_date)],
    ["Type:", (encounter.appointment_type || "N/A").replace(/_/g, " ")],
    ["Provider:", providerName],
    ["Status:", (encounter.status || "N/A").replace(/_/g, " ")],
  ]

  encounterInfo.forEach(([label, value]) => {
    checkPageBreak(7)
    doc.setFont("helvetica", "bold")
    doc.text(label, margin, yPosition)
    doc.setFont("helvetica", "normal")
    doc.text(value, margin + 40, yPosition)
    yPosition += 7
  })

  if (encounter.notes) {
    checkPageBreak(10)
    yPosition += 3
    doc.setFont("helvetica", "bold")
    doc.text("Chief Complaint:", margin, yPosition)
    yPosition += 6
    addWrappedText(encounter.notes, contentWidth, 10)
  }

  // SOAP Note Section
  if (data.encounterNote) {
    const note = data.encounterNote
    addSectionHeader("Progress Note (SOAP)")

    if (note.subjective) {
      checkPageBreak(8)
      doc.setFont("helvetica", "bold")
      doc.text("Subjective:", margin, yPosition)
      yPosition += 6
      addWrappedText(note.subjective, contentWidth, 10)
    }

    if (note.objective) {
      checkPageBreak(8)
      doc.setFont("helvetica", "bold")
      doc.text("Objective:", margin, yPosition)
      yPosition += 6
      addWrappedText(note.objective, contentWidth, 10)
    }

    if (note.assessment) {
      checkPageBreak(8)
      doc.setFont("helvetica", "bold")
      doc.text("Assessment:", margin, yPosition)
      yPosition += 6
      addWrappedText(note.assessment, contentWidth, 10)
    }

    if (note.plan) {
      checkPageBreak(8)
      doc.setFont("helvetica", "bold")
      doc.text("Plan:", margin, yPosition)
      yPosition += 6
      addWrappedText(note.plan, contentWidth, 10)
    }
  }

  // Vital Signs Section
  if (data.vitals && data.vitals.length > 0) {
    const latestVitals = data.vitals[0] // Get most recent vitals
    addSectionHeader("Vital Signs")

    const vitalsData: string[][] = []

    if (latestVitals.systolic_bp && latestVitals.diastolic_bp) {
      vitalsData.push(["Blood Pressure", `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp} mmHg`])
    }
    if (latestVitals.heart_rate) {
      vitalsData.push(["Heart Rate", `${latestVitals.heart_rate} bpm`])
    }
    if (latestVitals.respiratory_rate) {
      vitalsData.push(["Respiratory Rate", `${latestVitals.respiratory_rate} /min`])
    }
    if (latestVitals.temperature) {
      const unit = latestVitals.temperature_unit || "°F"
      vitalsData.push(["Temperature", `${latestVitals.temperature}${unit}`])
    }
    if (latestVitals.oxygen_saturation) {
      vitalsData.push(["Oxygen Saturation", `${latestVitals.oxygen_saturation}%`])
    }
    if (latestVitals.weight) {
      const unit = latestVitals.weight_unit || "lbs"
      vitalsData.push(["Weight", `${latestVitals.weight} ${unit}`])
    }
    if (latestVitals.height_feet && latestVitals.height_inches) {
      vitalsData.push(["Height", `${latestVitals.height_feet}' ${latestVitals.height_inches}"`])
    }
    if (latestVitals.bmi) {
      vitalsData.push(["BMI", latestVitals.bmi.toFixed(1)])
    }
    if (latestVitals.pain_scale !== null && latestVitals.pain_scale !== undefined) {
      vitalsData.push(["Pain Scale", `${latestVitals.pain_scale}/10`])
      if (latestVitals.pain_location) {
        vitalsData.push(["Pain Location", latestVitals.pain_location])
      }
    }

    if (vitalsData.length > 0) {
      checkPageBreak(20)
      autoTable(doc, {
        startY: yPosition,
        head: [["Measurement", "Value"]],
        body: vitalsData,
        theme: "striped",
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        margin: { left: margin, right: margin },
      })
      yPosition = (doc as any).lastAutoTable.finalY + 5
    }

    if (latestVitals.measurement_date) {
      checkPageBreak(6)
      doc.setFontSize(8)
      doc.setFont("helvetica", "italic")
      doc.setTextColor(120, 120, 120)
      doc.text(`Measured: ${formatDateTime(latestVitals.measurement_date)}`, margin, yPosition)
      yPosition += 5
    }
  }

  // Medications Section
  if (data.medications && data.medications.length > 0) {
    addSectionHeader("Active Medications")

    const medsData = data.medications.map((med) => [
      med.medication_name || "N/A",
      med.dosage || "N/A",
      med.frequency || "N/A",
      med.route || "N/A",
    ])

    checkPageBreak(20)
    autoTable(doc, {
      startY: yPosition,
      head: [["Medication", "Dosage", "Frequency", "Route"]],
      body: medsData,
      theme: "striped",
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      margin: { left: margin, right: margin },
    })
    yPosition = (doc as any).lastAutoTable.finalY + 5
  }

  // Assessments Section
  if (data.assessments && data.assessments.length > 0) {
    addSectionHeader("Assessments & Diagnoses")

    data.assessments.forEach((assessment, idx) => {
      if (idx > 0) {
        checkPageBreak(10)
        yPosition += 5
      }

      if (assessment.diagnosis_codes && assessment.diagnosis_codes.length > 0) {
        checkPageBreak(8)
        doc.setFont("helvetica", "bold")
        doc.text("Diagnosis Codes:", margin, yPosition)
        yPosition += 6
        assessment.diagnosis_codes.forEach((code) => {
          checkPageBreak(6)
          doc.setFont("helvetica", "normal")
          doc.text(`• ${code}`, margin + 5, yPosition)
          yPosition += 6
        })
      }

      if (assessment.chief_complaint) {
        checkPageBreak(8)
        doc.setFont("helvetica", "bold")
        doc.text("Chief Complaint:", margin, yPosition)
        yPosition += 6
        addWrappedText(assessment.chief_complaint, contentWidth, 10)
      }

      if (assessment.history_present_illness) {
        checkPageBreak(8)
        doc.setFont("helvetica", "bold")
        doc.text("History of Present Illness:", margin, yPosition)
        yPosition += 6
        addWrappedText(assessment.history_present_illness, contentWidth, 10)
      }

      if (assessment.treatment_plan) {
        checkPageBreak(8)
        doc.setFont("helvetica", "bold")
        doc.text("Treatment Plan:", margin, yPosition)
        yPosition += 6
        addWrappedText(assessment.treatment_plan, contentWidth, 10)
      }
    })
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Page ${i} of ${pageCount} - MASE EMR`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    )
  }

  // Generate filename
  const encounterDate = encounter.appointment_date
    ? new Date(encounter.appointment_date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0]
  const lastName = patient?.last_name || "Patient"
  const firstName = patient?.first_name || "Unknown"
  const filename = `Encounter_${lastName}_${firstName}_${encounterDate}.pdf`

  // Save the PDF
  doc.save(filename)
}
