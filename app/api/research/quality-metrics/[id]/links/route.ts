import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// GET - Fetch links for a quality metric
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const metricId = params.id

    // Verify metric exists
    const { data: metric, error: metricError } = await supabase
      .from("research_quality_metrics")
      .select("id, name")
      .eq("id", metricId)
      .single()

    if (metricError || !metric) {
      return NextResponse.json(
        { success: false, error: "Quality metric not found" },
        { status: 404 }
      )
    }

    // Fetch links
    const { data: links, error: linksError } = await supabase
      .from("research_quality_metric_links")
      .select("*")
      .eq("metric_id", metricId)
      .order("linked_entity_type")

    if (linksError) {
      console.error("Error fetching metric links:", linksError)
      return NextResponse.json(
        { success: false, error: linksError.message },
        { status: 500 }
      )
    }

    // Enrich links with entity details
    const enrichedLinks = await Promise.all(
      (links || []).map(async (link) => {
        let entityDetails = null
        
        switch (link.linked_entity_type) {
          case "ebp":
            const { data: ebp } = await supabase
              .from("evidence_based_practices")
              .select("id, name, category, adoption_rate, fidelity_score")
              .eq("id", link.linked_entity_id)
              .single()
            entityDetails = ebp
            break
          
          case "research_study":
            const { data: study } = await supabase
              .from("research_studies")
              .select("id, title, study_type, status, pi_name")
              .eq("id", link.linked_entity_id)
              .single()
            entityDetails = study
            break
          
          case "treatment_program":
            const { data: program } = await supabase
              .from("treatment_programs")
              .select("id, name, description")
              .eq("id", link.linked_entity_id)
              .single()
            entityDetails = program
            break
        }
        
        return {
          ...link,
          entity_details: entityDetails,
        }
      })
    )

    return NextResponse.json({
      success: true,
      metric: { id: metric.id, name: metric.name },
      links: enrichedLinks,
      summary: {
        total_links: enrichedLinks.length,
        by_type: {
          ebp: enrichedLinks.filter(l => l.linked_entity_type === "ebp").length,
          research_study: enrichedLinks.filter(l => l.linked_entity_type === "research_study").length,
          treatment_program: enrichedLinks.filter(l => l.linked_entity_type === "treatment_program").length,
          intervention: enrichedLinks.filter(l => l.linked_entity_type === "intervention").length,
        },
      },
    })

  } catch (error) {
    console.error("Unexpected error in GET /api/research/quality-metrics/[id]/links:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST - Create a new link
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const metricId = params.id
    const body = await request.json()

    // Validate required fields
    if (!body.linked_entity_type || !body.linked_entity_id) {
      return NextResponse.json(
        { success: false, error: "linked_entity_type and linked_entity_id are required" },
        { status: 400 }
      )
    }

    // Validate entity type
    const validTypes = ["ebp", "research_study", "treatment_program", "intervention"]
    if (!validTypes.includes(body.linked_entity_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid linked_entity_type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Verify metric exists
    const { data: metric, error: metricError } = await supabase
      .from("research_quality_metrics")
      .select("id")
      .eq("id", metricId)
      .single()

    if (metricError || !metric) {
      return NextResponse.json(
        { success: false, error: "Quality metric not found" },
        { status: 404 }
      )
    }

    // Verify linked entity exists
    let tableName = ""
    switch (body.linked_entity_type) {
      case "ebp":
        tableName = "evidence_based_practices"
        break
      case "research_study":
        tableName = "research_studies"
        break
      case "treatment_program":
        tableName = "treatment_programs"
        break
      default:
        tableName = ""
    }

    if (tableName) {
      const { data: entity, error: entityError } = await supabase
        .from(tableName)
        .select("id")
        .eq("id", body.linked_entity_id)
        .single()

      if (entityError || !entity) {
        return NextResponse.json(
          { success: false, error: `${body.linked_entity_type} not found` },
          { status: 404 }
        )
      }
    }

    // Create the link
    const { data: newLink, error: insertError } = await supabase
      .from("research_quality_metric_links")
      .insert({
        metric_id: metricId,
        linked_entity_type: body.linked_entity_type,
        linked_entity_id: body.linked_entity_id,
        relationship_type: body.relationship_type || "affects",
        impact_weight: body.impact_weight || 1.0,
        description: body.description || null,
      })
      .select()
      .single()

    if (insertError) {
      // Check for unique constraint violation
      if (insertError.code === "23505") {
        return NextResponse.json(
          { success: false, error: "This link already exists" },
          { status: 409 }
        )
      }
      console.error("Error creating link:", insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      link: newLink,
      message: "Link created successfully",
    })

  } catch (error) {
    console.error("Unexpected error in POST /api/research/quality-metrics/[id]/links:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// DELETE - Remove a link
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServiceClient()
    const metricId = params.id
    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get("link_id")

    if (!linkId) {
      return NextResponse.json(
        { success: false, error: "link_id is required" },
        { status: 400 }
      )
    }

    // Delete the link
    const { error: deleteError } = await supabase
      .from("research_quality_metric_links")
      .delete()
      .eq("id", linkId)
      .eq("metric_id", metricId)

    if (deleteError) {
      console.error("Error deleting link:", deleteError)
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Link deleted successfully",
    })

  } catch (error) {
    console.error("Unexpected error in DELETE /api/research/quality-metrics/[id]/links:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

