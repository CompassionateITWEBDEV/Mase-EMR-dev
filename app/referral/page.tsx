import { ReferralForm } from "@/components/public/referral-form"
import { Shield, Clock, Users, Phone } from "lucide-react"

export default function ReferralPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-background px-4 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Connect with Care
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground">
            Whether you're seeking help for yourself, a loved one, or referring as a community partner, we're here to
            guide you through the process.
          </p>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-b bg-muted/30 px-4 py-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 md:flex-row md:justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-blue-600" />
            <span>HIPAA Compliant</span>
          </div>
          <div className="hidden h-4 w-px bg-border md:block" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Response within 24-48 hours</span>
          </div>
          <div className="hidden h-4 w-px bg-border md:block" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-blue-600" />
            <span>Licensed Professionals</span>
          </div>
        </div>
      </section>

      {/* Referral Form */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <ReferralForm />
        </div>
      </section>

      {/* Crisis Notice */}
      <section className="bg-amber-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-amber-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <h3 className="mb-2 font-semibold text-amber-800">Is this an emergency?</h3>
                <p className="mb-4 text-sm text-amber-700">
                  If you or someone you know is in immediate danger or experiencing a mental health crisis, please
                  contact emergency services or a crisis line immediately.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href="tel:911" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white">
                    Call 911
                  </a>
                  <a href="tel:988" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white">
                    988 Crisis Line
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
