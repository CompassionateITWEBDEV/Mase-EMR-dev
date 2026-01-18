"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Heart,
  Brain,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  Shield,
  Zap,
  Clock,
  Users,
} from "lucide-react";

// Types for predictive insights
interface PredictiveInsight {
  category: string;
  level: "low" | "moderate" | "high";
  description: string;
  recommendedActions: string[];
  confidence?: number;
  timeframe?: string;
  factors?: string[];
}

interface PredictiveInsightsResponse {
  insights: PredictiveInsight[];
  generatedAt?: string;
  patientId?: string;
}

export interface PredictiveInsightsDashboardProps {
  /** Patient ID to analyze */
  patientId: string;
  /** Optional callback when an action is selected */
  onActionSelect?: (action: string, insight: PredictiveInsight) => void;
  /** Whether to auto-load insights on mount */
  autoLoad?: boolean;
  /** Compact mode for embedding in other views */
  compact?: boolean;
}

/**
 * Predictive Insights Dashboard Component
 * Displays AI-generated risk predictions and preventive recommendations
 */
export function PredictiveInsightsDashboard({
  patientId,
  onActionSelect,
  autoLoad = false,
  compact = false,
}: PredictiveInsightsDashboardProps) {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<Set<number>>(new Set());
  const [filterLevel, setFilterLevel] = useState<"all" | "high" | "moderate" | "low">("all");

  // Load insights
  const loadInsights = async () => {
    if (!patientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ai-assistant/predictive-insights?patientId=${patientId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load predictive insights");
      }

      const data: PredictiveInsightsResponse = await response.json();
      setInsights(data.insights || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && patientId) {
      loadInsights();
    }
  }, [autoLoad, patientId]);

  // Toggle insight expansion
  const toggleExpanded = (index: number) => {
    setExpandedInsights((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-600 dark:text-red-400";
      case "moderate":
        return "text-yellow-600 dark:text-yellow-400";
      case "low":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-muted-foreground";
    }
  };

  // Get risk level badge variant
  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case "high":
        return "destructive";
      case "moderate":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes("cardiovascular") || categoryLower.includes("heart")) {
      return <Heart className="h-5 w-5" />;
    }
    if (categoryLower.includes("mental") || categoryLower.includes("psychiatric") || categoryLower.includes("cognitive")) {
      return <Brain className="h-5 w-5" />;
    }
    if (categoryLower.includes("readmission") || categoryLower.includes("hospital")) {
      return <Activity className="h-5 w-5" />;
    }
    if (categoryLower.includes("fall") || categoryLower.includes("safety")) {
      return <Shield className="h-5 w-5" />;
    }
    if (categoryLower.includes("diabetes") || categoryLower.includes("metabolic")) {
      return <Zap className="h-5 w-5" />;
    }
    return <Target className="h-5 w-5" />;
  };

  // Filter insights by level
  const filteredInsights = insights.filter((insight) => {
    if (filterLevel === "all") return true;
    return insight.level === filterLevel;
  });

  // Sort by risk level (high first)
  const sortedInsights = [...filteredInsights].sort((a, b) => {
    const levelOrder = { high: 0, moderate: 1, low: 2 };
    return levelOrder[a.level] - levelOrder[b.level];
  });

  // Calculate summary stats
  const highRiskCount = insights.filter((i) => i.level === "high").length;
  const moderateRiskCount = insights.filter((i) => i.level === "moderate").length;
  const lowRiskCount = insights.filter((i) => i.level === "low").length;

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Predictive Insights
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadInsights}
              disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
          {!isLoading && insights.length === 0 && !error && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadInsights}
              className="w-full">
              Load Predictions
            </Button>
          )}
          {insights.length > 0 && (
            <div className="space-y-2">
              <div className="flex gap-2 text-xs">
                {highRiskCount > 0 && (
                  <Badge variant="destructive">{highRiskCount} High</Badge>
                )}
                {moderateRiskCount > 0 && (
                  <Badge variant="default">{moderateRiskCount} Moderate</Badge>
                )}
                {lowRiskCount > 0 && (
                  <Badge variant="secondary">{lowRiskCount} Low</Badge>
                )}
              </div>
              {sortedInsights.slice(0, 3).map((insight, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs p-2 bg-muted rounded">
                  <span className={getRiskLevelColor(insight.level)}>
                    {insight.level === "high" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : insight.level === "moderate" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                  </span>
                  <span className="truncate">{insight.category}</span>
                </div>
              ))}
              {insights.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{insights.length - 3} more insights
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Predictive Health Insights
              </CardTitle>
              <CardDescription>
                AI-powered risk predictions and preventive recommendations
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={filterLevel}
                onValueChange={(value: "all" | "high" | "moderate" | "low") =>
                  setFilterLevel(value)
                }>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="moderate">Moderate Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={loadInsights}
                disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          {insights.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {highRiskCount}
                </p>
                <p className="text-xs text-muted-foreground">High Risk</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {moderateRiskCount}
                </p>
                <p className="text-xs text-muted-foreground">Moderate Risk</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {lowRiskCount}
                </p>
                <p className="text-xs text-muted-foreground">Low Risk</p>
              </div>
            </div>
          )}

          {lastUpdated && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={loadInsights}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">
                Analyzing patient data for risk predictions...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && insights.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                No predictive insights available yet.
              </p>
              <Button onClick={loadInsights}>
                Generate Predictions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights List */}
      {sortedInsights.length > 0 && (
        <div className="space-y-4">
          {sortedInsights.map((insight, index) => (
            <Card
              key={index}
              className={`border-l-4 ${
                insight.level === "high"
                  ? "border-l-red-500"
                  : insight.level === "moderate"
                  ? "border-l-yellow-500"
                  : "border-l-green-500"
              }`}>
              <Collapsible
                open={expandedInsights.has(index)}
                onOpenChange={() => toggleExpanded(index)}>
                <CardHeader className="pb-2">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={getRiskLevelColor(insight.level)}>
                          {getCategoryIcon(insight.category)}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {insight.category}
                          </CardTitle>
                          {insight.timeframe && (
                            <p className="text-xs text-muted-foreground">
                              Timeframe: {insight.timeframe}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskLevelBadge(insight.level) as any}>
                          {insight.level.charAt(0).toUpperCase() + insight.level.slice(1)} Risk
                        </Badge>
                        {insight.confidence && (
                          <Badge variant="outline">
                            {Math.round(insight.confidence * 100)}% confidence
                          </Badge>
                        )}
                        {expandedInsights.has(index) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>

                  {/* Confidence Progress Bar */}
                  {insight.confidence && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Confidence Level</span>
                        <span>{Math.round(insight.confidence * 100)}%</span>
                      </div>
                      <Progress
                        value={insight.confidence * 100}
                        className="h-2"
                      />
                    </div>
                  )}

                  <CollapsibleContent>
                    {/* Contributing Factors */}
                    {insight.factors && insight.factors.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Contributing Factors:</p>
                        <ul className="space-y-1">
                          {insight.factors.map((factor, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Actions */}
                    {insight.recommendedActions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                        <div className="space-y-2">
                          {insight.recommendedActions.map((action, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-muted rounded">
                              <span className="text-sm">{action}</span>
                              {onActionSelect && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onActionSelect(action, insight)}>
                                  <Target className="h-3 w-3 mr-1" />
                                  Act
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </CardContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Population Health View (Admin/Manager) */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Risk Distribution Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>High Risk</span>
                  <span>{highRiskCount} ({Math.round((highRiskCount / insights.length) * 100)}%)</span>
                </div>
                <Progress
                  value={(highRiskCount / insights.length) * 100}
                  className="h-2 bg-red-100 dark:bg-red-900"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Moderate Risk</span>
                  <span>{moderateRiskCount} ({Math.round((moderateRiskCount / insights.length) * 100)}%)</span>
                </div>
                <Progress
                  value={(moderateRiskCount / insights.length) * 100}
                  className="h-2 bg-yellow-100 dark:bg-yellow-900"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Low Risk</span>
                  <span>{lowRiskCount} ({Math.round((lowRiskCount / insights.length) * 100)}%)</span>
                </div>
                <Progress
                  value={(lowRiskCount / insights.length) * 100}
                  className="h-2 bg-green-100 dark:bg-green-900"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
