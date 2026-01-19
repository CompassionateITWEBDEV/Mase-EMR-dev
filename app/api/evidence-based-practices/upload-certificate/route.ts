import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = createServiceClient()
    const formData = await request.formData()
    const file = formData.get("file") as File
    const ebpId = formData.get("ebpId") as string
    const staffId = formData.get("staffId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ebpId) {
      return NextResponse.json({ error: "EBP ID is required" }, { status: 400 })
    }

    // Validate file type (PDF, images, documents)
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          message: "Allowed types: PDF, JPEG, PNG, DOC, DOCX",
        },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large", message: "Maximum file size is 10MB" },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = staffId
      ? `certificate-${ebpId}-${staffId}-${timestamp}.${fileExtension}`
      : `certificate-${ebpId}-${timestamp}.${fileExtension}`

    // Upload to Supabase Storage
    const bucketName = "ebp-certificates" // You may need to create this bucket in Supabase

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading certificate:", uploadError)
      
      // If bucket doesn't exist, provide helpful error
      if (uploadError.message?.includes("Bucket not found")) {
        return NextResponse.json(
          {
            error: "Storage bucket not found",
            message: `Please create a storage bucket named "${bucketName}" in Supabase Storage.`,
            code: "BUCKET_NOT_FOUND",
          },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { error: "Failed to upload file", message: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
      message: "Certificate uploaded successfully",
    })
  } catch (error) {
    console.error("Unexpected error in POST /api/evidence-based-practices/upload-certificate:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

