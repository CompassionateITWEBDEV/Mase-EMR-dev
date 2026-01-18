import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import ExternalTransferPortal from "./external-transfer-portal"

export default function ExternalTransferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 to-white">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      }
    >
      <ExternalTransferPortal />
    </Suspense>
  )
}
