import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Document upload endpoint
 * 
 * Note: This is a basic implementation. For production, you may want to:
 * - Use Supabase Storage for file storage
 * - Add file validation and virus scanning
 * - Implement proper authentication/authorization
 * - Add file size limits and type restrictions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const formData = await request.formData()
    const file = formData.get("file") as File
    const patientId = formData.get("patient_id") as string
    const documentType = formData.get("document_type") as string
    const folder = formData.get("folder") as string || "patient-documents"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `${folder}/${patientId || "anonymous"}/${timestamp}_${sanitizedFileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents") // Make sure this bucket exists in Supabase
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("[Upload Document] Storage error:", uploadError)
      // If storage bucket doesn't exist, return a placeholder response
      // In production, ensure the bucket is created
      return NextResponse.json({
        error: "Storage not configured. Please set up Supabase Storage bucket 'documents'",
        message: "File upload functionality requires Supabase Storage to be configured",
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

    // Optionally, save document metadata to database
    // This would require a documents table in the database
    // For now, just return the upload info

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        path: filePath,
        url: urlData.publicUrl,
        uploadedAt: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("[Upload Document] Error:", error)
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 })
  }
}
