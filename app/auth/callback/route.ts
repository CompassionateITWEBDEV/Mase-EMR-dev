import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Auth Callback Route
 * Handles email confirmation links from Supabase
 * 
 * When a user clicks the confirmation link in their email, Supabase redirects here
 * with tokens in the URL. This route exchanges those tokens for a session.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next") ?? "/"

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      // Email confirmed successfully - redirect to home or specified next URL
      const redirectUrl = new URL(next, requestUrl.origin)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If there's an error or missing params, redirect to login with error message
  const redirectUrl = new URL("/auth/login", requestUrl.origin)
  redirectUrl.searchParams.set("error", "email_confirmation_failed")
  return NextResponse.redirect(redirectUrl)
}

