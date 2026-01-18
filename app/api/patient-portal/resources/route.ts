import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return community resources for addiction recovery
    const resources = {
      crisisLines: [
        {
          name: "SAMHSA National Helpline",
          phone: "1-800-662-4357",
          available: "24/7",
          description: "Free, confidential, 24/7 treatment referral and information service",
        },
        {
          name: "National Suicide Prevention Lifeline",
          phone: "988",
          available: "24/7",
          description: "Crisis support for mental health emergencies",
        },
        {
          name: "Crisis Text Line",
          phone: "Text HOME to 741741",
          available: "24/7",
          description: "Free crisis counseling via text message",
        },
      ],
      supportGroups: [
        {
          name: "Narcotics Anonymous",
          website: "https://na.org",
          type: "In-person & Virtual",
          description: "12-step program for recovery from addiction",
        },
        {
          name: "Alcoholics Anonymous",
          website: "https://aa.org",
          type: "In-person & Virtual",
          description: "Support group for alcohol addiction recovery",
        },
        {
          name: "SMART Recovery",
          website: "https://smartrecovery.org",
          type: "In-person & Virtual",
          description: "Science-based addiction recovery support",
        },
        {
          name: "Celebrate Recovery",
          website: "https://celebraterecovery.com",
          type: "In-person",
          description: "Faith-based 12-step recovery program",
        },
      ],
      michiganResources: [
        {
          name: "Michigan DHHS Substance Abuse Services",
          phone: "1-800-535-6136",
          website: "https://michigan.gov/mdhhs",
          description: "State resources for substance abuse treatment",
        },
        {
          name: "MI Health Link",
          phone: "1-800-642-3195",
          description: "Medicaid managed care for dual eligible individuals",
        },
        { name: "Community Mental Health", description: "Local CMH services available in each Michigan county" },
      ],
      housingAssistance: [
        { name: "Oxford Houses", website: "https://oxfordhouse.org", description: "Self-supporting recovery housing" },
        {
          name: "Salvation Army Adult Rehabilitation Centers",
          description: "Long-term residential rehabilitation and housing",
        },
        { name: "Local Sober Living Homes", description: "Structured recovery housing in your area" },
      ],
      employmentServices: [
        {
          name: "Michigan Works!",
          website: "https://michiganworks.org",
          description: "Job training and employment services",
        },
        { name: "Vocational Rehabilitation", description: "Employment support for individuals with disabilities" },
      ],
    }

    return NextResponse.json(resources)
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
  }
}
