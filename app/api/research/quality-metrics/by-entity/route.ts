import { createServiceClient } from "@/lib/supabase/service-role"
import { NextResponse } from "next/server"

// GET - Fetch quality metrics linked to a specific entity (EBP, study, etc.)
export async function GET(request: Request) {
  try {
    const supabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    
    const entityType = searchParams.get("entity_type")
    const entityId = searchParams.get("entity_id")

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: "entity_type and entity_id are required" },
        { status: 400 }
      )
    }

    // Validate entity type
    const validTypes = ["ebp", "research_study", "treatment_program", "intervention"]
    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { success: false, error: `Invalid entity_type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      )
    }

    // Get links for this entity
    const { data: links, error: linksError } = await supabase
      .from("research_quality_metric_links")
      .select("metric_id, relationship_type, impact_weight, description")
      .eq("linked_entity_type", entityType)
      .eq("linked_entity_id", entityId)

    if (linksError) {
      console.error("Error fetching links:", linksError)
      return NextResponse.json(
        { success: false, error: linksError.message },
        { status: 500 }
      )
    }

    if (!links || links.length === 0) {
      return NextResponse.json({
        success: true,
        metrics: [],
        total: 0,
      })
    }

    // Get the metric details
    const metricIds = links.map(l => l.metric_id)
    
    const { data: metrics, error: metricsError } = await supabase
      .from("research_quality_metrics")
      .select("*")
      .in("id", metricIds)
      .eq("is_active", true)

    if (metricsError) {
      console.error("Error fetching metrics:", metricsError)
      return NextResponse.json(
        { success: false, error: metricsError.message },
        { status: 500 }
      )
    }

    // Get latest snapshots for each metric
    const { data: snapshots, error: snapshotsError } = await supabase
      .from("research_quality_snapshots")
      .select("*")
      .in("metric_id", metricIds)
      .order("snapshot_date", { ascending: false })

    if (snapshotsError) {
      console.error("Error fetching snapshots:", snapshotsError)
    }

    // Group snapshots by metric
    const latestSnapshotByMetric: Record<string, any> = {}
    if (snapshots) {
      for (const snapshot of snapshots) {
        if (!latestSnapshotByMetric[snapshot.metric_id]) {
          latestSnapshotByMetric[snapshot.metric_id] = snapshot
        }
      }
    }

    // Combine metrics with link info and snapshot data
    const enrichedMetrics = (metrics || []).map(metric => {
      const link = links.find(l => l.metric_id === metric.id)
      const snapshot = latestSnapshotByMetric[metric.id]
      
      return {
        ...metric,
        current_value: snapshot?.current_value ?? null,
        trend: snapshot?.trend ?? null,
        trend_percentage: snapshot?.trend_percentage ?? null,
        meets_target: snapshot?.meets_target ?? null,
        meets_benchmark: snapshot?.meets_benchmark ?? null,
        last_calculated: snapshot?.created_at ?? null,
        relationship_type: link?.relationship_type,
        impact_weight: link?.impact_weight,
        link_description: link?.description,
      }
    })

    // Calculate impact summary
    const impactSummary = {
      total_metrics: enrichedMetrics.length,
      meeting_target: enrichedMetrics.filter(m => m.meets_target).length,
      below_target: enrichedMetrics.filter(m => m.meets_target === false).length,
      average_performance: enrichedMetrics.length > 0
        ? Math.round(
            enrichedMetrics
              .filter(m => m.current_value !== null)
              .reduce((sum, m) => sum + (m.current_value || 0), 0) /
            enrichedMetrics.filter(m => m.current_value !== null).length * 10
          ) / 10
        : 0,
      weighted_impact: enrichedMetrics.reduce((sum, m) => sum + (m.impact_weight || 1), 0),
    }

    return NextResponse.json({
      success: true,
      entity: { type: entityType, id: entityId },
      metrics: enrichedMetrics,
      total: enrichedMetrics.length,
      impact_summary: impactSummary,
    })

  } catch (error) {
    console.error("Unexpected error in GET /api/research/quality-metrics/by-entity:", error)
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

