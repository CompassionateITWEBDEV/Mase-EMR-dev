import { redirect } from "next/navigation"

/**
 * Redirect from /discharge-summaries to /discharge-summary
 * This page is deprecated. Use /discharge-summary instead.
 */
export default function DischargeSummariesRedirect() {
  redirect("/discharge-summary")
}
