import type { ReactNode } from "react"
import Link from "next/link"
import { Heart, Phone, Mail, MapPin } from "lucide-react"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-teal-50 to-white">
      {/* Public Header */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/screening" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">MASE Behavioral Health</span>
                <p className="text-xs text-muted-foreground">Community Outreach</p>
              </div>
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link href="/screening" className="text-sm font-medium text-gray-600 hover:text-teal-600">
                Free Screening
              </Link>
              <Link href="/referral" className="text-sm font-medium text-gray-600 hover:text-teal-600">
                Make a Referral
              </Link>
              <Link
                href="/auth/login"
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Provider Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      <footer className="border-t bg-gray-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">MASE Behavioral Health</span>
              </div>
              <p className="text-sm text-gray-400">
                Compassionate behavioral health services for individuals and families in our community.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Mental Health Counseling</li>
                <li>Substance Use Treatment</li>
                <li>Medication Management</li>
                <li>Crisis Intervention</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/screening" className="hover:text-white">
                    Free Screening Tools
                  </Link>
                </li>
                <li>
                  <Link href="/referral" className="hover:text-white">
                    Make a Referral
                  </Link>
                </li>
                <li>Insurance Information</li>
                <li>Patient Rights</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Contact</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>1-800-555-HELP</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>help@mase-health.org</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4" />
                  <span>123 Wellness Way, Suite 100</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} MASE Behavioral Health. All rights reserved.</p>
            <p className="mt-2">
              If you or someone you know is in crisis, call 988 (Suicide & Crisis Lifeline) or text HOME to 741741.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
