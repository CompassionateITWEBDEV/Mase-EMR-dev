import { notFound } from "next/navigation"
import { ScreeningAssessment } from "@/components/public/screening-assessment"

const screeningData = {
  "phq-9": {
    title: "Patient Health Questionnaire (PHQ-9)",
    subtitle: "Depression Screening",
    description: "Over the last 2 weeks, how often have you been bothered by any of the following problems?",
    questions: [
      "Little interest or pleasure in doing things",
      "Feeling down, depressed, or hopeless",
      "Trouble falling or staying asleep, or sleeping too much",
      "Feeling tired or having little energy",
      "Poor appetite or overeating",
      "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
      "Trouble concentrating on things, such as reading the newspaper or watching television",
      "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
      "Thoughts that you would be better off dead or of hurting yourself in some way",
    ],
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" },
    ],
    scoring: [
      {
        min: 0,
        max: 4,
        severity: "Minimal",
        color: "green",
        recommendation:
          "Your responses suggest minimal symptoms of depression. Continue to monitor your mood and practice self-care.",
      },
      {
        min: 5,
        max: 9,
        severity: "Mild",
        color: "yellow",
        recommendation:
          "Your responses suggest mild symptoms. Consider self-help strategies, and if symptoms persist, speaking with a healthcare provider may be helpful.",
      },
      {
        min: 10,
        max: 14,
        severity: "Moderate",
        color: "orange",
        recommendation:
          "Your responses suggest moderate symptoms of depression. We recommend speaking with a mental health professional for evaluation and support.",
      },
      {
        min: 15,
        max: 19,
        severity: "Moderately Severe",
        color: "red",
        recommendation:
          "Your responses suggest moderately severe symptoms. We strongly recommend connecting with a mental health provider for treatment options.",
      },
      {
        min: 20,
        max: 27,
        severity: "Severe",
        color: "red",
        recommendation:
          "Your responses suggest severe symptoms of depression. Please reach out to a mental health professional as soon as possible. If you're having thoughts of self-harm, contact the 988 Suicide & Crisis Lifeline immediately.",
      },
    ],
  },
  "gad-7": {
    title: "Generalized Anxiety Disorder Scale (GAD-7)",
    subtitle: "Anxiety Screening",
    description: "Over the last 2 weeks, how often have you been bothered by the following problems?",
    questions: [
      "Feeling nervous, anxious, or on edge",
      "Not being able to stop or control worrying",
      "Worrying too much about different things",
      "Trouble relaxing",
      "Being so restless that it's hard to sit still",
      "Becoming easily annoyed or irritable",
      "Feeling afraid as if something awful might happen",
    ],
    options: [
      { value: 0, label: "Not at all" },
      { value: 1, label: "Several days" },
      { value: 2, label: "More than half the days" },
      { value: 3, label: "Nearly every day" },
    ],
    scoring: [
      {
        min: 0,
        max: 4,
        severity: "Minimal",
        color: "green",
        recommendation:
          "Your responses suggest minimal anxiety symptoms. Continue practicing stress management and self-care techniques.",
      },
      {
        min: 5,
        max: 9,
        severity: "Mild",
        color: "yellow",
        recommendation:
          "Your responses suggest mild anxiety. Self-help strategies like relaxation techniques, exercise, and mindfulness may be beneficial.",
      },
      {
        min: 10,
        max: 14,
        severity: "Moderate",
        color: "orange",
        recommendation:
          "Your responses suggest moderate anxiety. Consider speaking with a mental health professional for evaluation and coping strategies.",
      },
      {
        min: 15,
        max: 21,
        severity: "Severe",
        color: "red",
        recommendation:
          "Your responses suggest severe anxiety symptoms. We recommend connecting with a mental health provider for treatment and support.",
      },
    ],
  },
  general: {
    title: "General Mental Health Check-In",
    subtitle: "Comprehensive Well-Being Assessment",
    description: "Please answer the following questions about your experiences over the past month.",
    questions: [
      "How often have you felt overwhelmed by daily responsibilities?",
      "How often have you experienced difficulty sleeping or changes in sleep patterns?",
      "How often have you felt disconnected from friends, family, or activities you usually enjoy?",
      "How often have you experienced persistent feelings of sadness or emptiness?",
      "How often have you felt excessive worry or fear?",
      "How often have you had difficulty concentrating or making decisions?",
      "How often have you experienced changes in appetite or eating habits?",
      "How often have you felt physically tense or had unexplained aches and pains?",
      "How often have you felt hopeless about the future?",
      "How satisfied are you with your current quality of life?",
    ],
    options: [
      { value: 0, label: "Rarely or never" },
      { value: 1, label: "Sometimes" },
      { value: 2, label: "Often" },
      { value: 3, label: "Very often or always" },
    ],
    scoring: [
      {
        min: 0,
        max: 7,
        severity: "Good",
        color: "green",
        recommendation:
          "Your responses indicate overall good mental well-being. Continue prioritizing self-care and maintaining healthy habits.",
      },
      {
        min: 8,
        max: 15,
        severity: "Mild Concerns",
        color: "yellow",
        recommendation:
          "Your responses suggest some areas that may benefit from attention. Consider exploring our educational resources and self-help tools.",
      },
      {
        min: 16,
        max: 23,
        severity: "Moderate Concerns",
        color: "orange",
        recommendation:
          "Your responses indicate moderate mental health concerns. Speaking with a mental health professional could provide valuable support and guidance.",
      },
      {
        min: 24,
        max: 30,
        severity: "Significant Concerns",
        color: "red",
        recommendation:
          "Your responses suggest significant mental health concerns. We encourage you to connect with a mental health provider for comprehensive evaluation and support.",
      },
    ],
  },
}

interface PageProps {
  params: Promise<{ type: string }>
}

export default async function ScreeningAssessmentPage({ params }: PageProps) {
  const { type } = await params

  const data = screeningData[type as keyof typeof screeningData]

  if (!data) {
    notFound()
  }

  return <ScreeningAssessment type={type} data={data} />
}

export async function generateStaticParams() {
  return Object.keys(screeningData).map((type) => ({ type }))
}
