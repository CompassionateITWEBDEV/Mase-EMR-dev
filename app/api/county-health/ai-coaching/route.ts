import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { message, programArea } = await request.json();

    // Fetch relevant AI coaching scenarios based on program area
    const { data: scenarios } = await supabase
      .from("county_health_ai_coaching_scenarios")
      .select("*")
      .eq("is_active", true)
      .eq("program_area", programArea);

    // In production, this would call an LLM with the scenarios as context
    // For now, return structured guidance based on keywords
    let response = "";

    if (
      message.toLowerCase().includes("wic") ||
      message.toLowerCase().includes("eligibility")
    ) {
      response = `**WIC Eligibility Determination**

To determine WIC eligibility, check these three criteria:

1. **Categorical Eligibility**
   - Pregnant women (during pregnancy and up to 6 weeks postpartum)
   - Breastfeeding women (up to 1 year postpartum)
   - Non-breastfeeding postpartum women (up to 6 months)
   - Infants (under 1 year)
   - Children (ages 1-5)

2. **Income Eligibility**
   - Income at or below 185% of federal poverty level
   - OR automatically qualified if enrolled in Medicaid, SNAP, or TANF

3. **Nutritional Risk**
   - Anthropometric (height/weight concerns)
   - Biochemical (anemia, high lead levels)
   - Clinical (pregnancy complications, preterm birth)
   - Dietary (poor diet quality, picky eating)

**Pro Tip:** Always ask about Medicaid/SNAP first - this provides adjunctive eligibility and speeds up the process!

**Call to Action:** Would you like me to explain how to document nutritional risk or help with a specific case?`;
    } else if (
      message.toLowerCase().includes("immun") ||
      message.toLowerCase().includes("vaccin")
    ) {
      response = `**Immunization Walk-In Clinic Guidance**

For Oakland County's walk-in immunization clinics (North & South locations, Mon-Fri 8:30 AM - 5:00 PM):

**Key Points:**
- $7 admin fee per vaccine (sliding scale available)
- No appointment needed
- All ages welcome
- Accept Medicare, Medicaid, most BCBS plans

**Common Scenarios:**

1. **Catch-Up Vaccines**
   - Check MCIR (Michigan Care Improvement Registry) for history
   - Follow ACIP catch-up schedule
   - Can give multiple vaccines same day

2. **Adult Vaccines**
   - COVID-19, Flu, Tdap, Pneumococcal, Shingles, HPV (up to age 45)
   - Screen for high-risk conditions (diabetes, immunocompromised)

3. **Travel Vaccines**
   - Refer to travel clinic for yellow fever, typhoid, Japanese encephalitis
   - Can provide hepatitis A, hepatitis B here

**Minimum Intervals:** Most vaccines need 4 weeks between doses. Live vaccines must be given same day or 28 days apart.

Would you like help with a specific vaccine schedule or adverse event management?`;
    } else if (
      message.toLowerCase().includes("std") ||
      message.toLowerCase().includes("sti") ||
      message.toLowerCase().includes("hiv")
    ) {
      response = `**Sexual Health Services ($5 Clinic Visit Fee)**

Oakland County offers comprehensive STI testing and treatment:

**Services Available:**
- HIV testing & counseling
- PrEP (Pre-Exposure Prophylaxis for HIV prevention)
- nPEP (Post-Exposure Prophylaxis within 72 hours)
- STI screening: Gonorrhea, Chlamydia, Syphilis
- Treatment services
- Partner notification

**Clinical Protocols:**

**PrEP Eligibility:**
- HIV-negative with HIV-positive partner
- Multiple sexual partners
- Inconsistent condom use
- Recent bacterial STI
- Injection drug use with shared needles

**Partner Notification:**
- Gonorrhea/Chlamydia: 60-day lookback
- Syphilis: 90-day lookback
- EPT (Expedited Partner Therapy) legal in Michigan for GC/CT (not syphilis)

**Important:** Michigan has Good Samaritan protections - patients and partners cannot be prosecuted for drug use when seeking STI care.

Need help with a specific case or treatment protocol?`;
    } else if (
      message.toLowerCase().includes("maternal") ||
      message.toLowerCase().includes("prenatal") ||
      message.toLowerCase().includes("home visit")
    ) {
      response = `**Maternal & Child Health Home Visiting**

MCH home visiting provides comprehensive support for pregnant women and families with young children:

**Key Services:**
- Prenatal care coordination
- Breastfeeding support
- Infant/child development screening
- Parenting education
- SDOH (Social Determinants of Health) screening
- Connection to community resources

**Required Screenings:**

1. **Edinburgh Postnatal Depression Scale (EPDS)**
   - Screen at every postpartum visit
   - Score ≥10 = possible depression
   - Question 10 screens suicide risk - ALWAYS address immediately

2. **ASQ-3 (Developmental Screening)**
   - Ages 2, 4, 6, 9, 12, 18, 24, 30, 36 months
   - Concerns trigger early intervention referral

3. **SDOH Assessment**
   - Housing stability
   - Food security
   - Transportation
   - Utilities
   - Safety

**Referral Pathways:**
- WIC for nutrition support
- Early On (0-3 early intervention)
- Maternal Mental Health Hotline: 1-833-9-HELP4MOMS
- Community Mental Health
- DHS for SNAP/TANF

Would you like guidance on EPDS interpretation or early intervention referrals?`;
    } else {
      response = `I'm your AI County Health Coach! I can help with:

- **WIC Program:** Eligibility, nutrition counseling, breastfeeding support
- **Immunizations:** ACIP schedules, catch-up vaccines, vaccine safety
- **Sexual Health:** HIV/STI testing, PrEP, partner notification
- **Maternal & Child Health:** Home visiting, prenatal care, developmental screening
- **TB Management:** Skin testing, contact tracing, DOT
- **Communicable Disease:** Reporting, surveillance, outbreak investigation
- **Environmental Health:** Food safety, water quality, septic inspections

What area would you like help with?`;
    }

    return NextResponse.json({
      response,
      scenarios: scenarios || [],
      programArea,
    });
  } catch (error) {
    console.error("[v0] Error in county health AI coaching:", error);
    return NextResponse.json(
      { error: "Failed to process AI coaching request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const programArea = searchParams.get("programArea");

    const query = supabase
      .from("county_health_ai_coaching_scenarios")
      .select("*")
      .eq("is_active", true);

    if (programArea) {
      query.eq("program_area", programArea);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ scenarios: data || [] });
  } catch (error) {
    console.error("[v0] Error fetching AI scenarios:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI coaching scenarios" },
      { status: 500 }
    );
  }
}
