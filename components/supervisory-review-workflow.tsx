"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  MessageSquare,
  User,
  Calendar,
  FileText,
  AlertTriangle,
  ThumbsUp,
  Edit,
  Send,
} from "lucide-react";

// Interface for review items
interface ReviewItem {
  id: number;
  assessmentId: string;
  patientName: string;
  patientId: string;
  providerId: string;
  providerName: string;
  documentType: string;
  documentTitle: string;
  submittedDate: string;
  reviewStatus: string;
  priority: string;
  estimatedReviewTime: number;
  clinicalNotes: string;
  treatmentGoals?: string[];
  lastReviewDate: string | null;
  requiresUrgentReview: boolean;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedDate?: string;
}

// Mock data for supervisory reviews
const reviewItems: ReviewItem[] = [
  {
    id: 1,
    assessmentId: "A001",
    patientName: "Sarah Johnson",
    patientId: "P001",
    providerId: "PR001",
    providerName: "Dr. Emily Smith",
    documentType: "Treatment Plan",
    documentTitle: "Initial Treatment Plan - Major Depressive Disorder",
    submittedDate: "2024-01-15T10:30:00Z",
    reviewStatus: "pending",
    priority: "high",
    estimatedReviewTime: 15,
    clinicalNotes:
      "Patient presents with severe depression, PHQ-9 score of 18. Recommending CBT and medication evaluation.",
    treatmentGoals: [
      "Reduce depressive symptoms",
      "Improve daily functioning",
      "Develop coping strategies",
    ],
    lastReviewDate: null,
    requiresUrgentReview: true,
  },
  {
    id: 2,
    assessmentId: "A002",
    patientName: "Michael Chen",
    patientId: "P002",
    providerId: "PR002",
    providerName: "Dr. James Wilson",
    documentType: "Progress Note",
    documentTitle: "Weekly Progress Note - Session 4",
    submittedDate: "2024-01-14T14:20:00Z",
    reviewStatus: "needs_revision",
    priority: "medium",
    estimatedReviewTime: 10,
    clinicalNotes:
      "Patient showing improvement in anxiety symptoms. GAD-7 score decreased from 15 to 10.",
    reviewNotes:
      "Please add more detail about specific interventions used and patient response.",
    reviewedBy: "Dr. Sarah Johnson",
    reviewedDate: "2024-01-15T09:00:00Z",
    lastReviewDate: "2024-01-15T09:00:00Z",
    requiresUrgentReview: false,
  },
  {
    id: 3,
    assessmentId: "A003",
    patientName: "Emily Rodriguez",
    patientId: "P003",
    providerId: "PR001",
    providerName: "Dr. Emily Smith",
    documentType: "Assessment",
    documentTitle: "COWS Assessment - Withdrawal Monitoring",
    submittedDate: "2024-01-15T08:15:00Z",
    reviewStatus: "approved",
    priority: "high",
    estimatedReviewTime: 5,
    clinicalNotes:
      "COWS score of 8 indicates mild withdrawal. Patient stable for continued outpatient treatment.",
    reviewNotes:
      "Assessment is thorough and appropriate. Approved for implementation.",
    reviewedBy: "Dr. Sarah Johnson",
    reviewedDate: "2024-01-15T11:30:00Z",
    lastReviewDate: "2024-01-15T11:30:00Z",
    requiresUrgentReview: false,
  },
  {
    id: 4,
    assessmentId: "A004",
    patientName: "David Wilson",
    patientId: "P004",
    providerId: "PR003",
    providerName: "Dr. Lisa Thompson",
    documentType: "Safety Plan",
    documentTitle: "Crisis Safety Plan - High Risk Patient",
    submittedDate: "2024-01-15T16:45:00Z",
    reviewStatus: "pending",
    priority: "urgent",
    estimatedReviewTime: 20,
    clinicalNotes:
      "Patient endorsed suicidal ideation with plan. C-SSRS indicates high risk. Immediate safety planning required.",
    treatmentGoals: [
      "Ensure patient safety",
      "Develop crisis coping strategies",
      "Establish support network",
    ],
    lastReviewDate: null,
    requiresUrgentReview: true,
  },
];

const statusConfig = {
  pending: {
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
    iconColor: "text-yellow-600",
  },
  approved: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  needs_revision: {
    color: "bg-orange-100 text-orange-800",
    icon: Edit,
    iconColor: "text-orange-600",
  },
  rejected: {
    color: "bg-red-100 text-red-800",
    icon: XCircle,
    iconColor: "text-red-600",
  },
};

const priorityConfig = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

export function SupervisoryReviewWorkflow() {
  const [reviews, setReviews] = useState<ReviewItem[]>(reviewItems);
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewDecision, setReviewDecision] = useState("");

  const handleReviewSubmit = (
    reviewId: number,
    decision: string,
    notes: string
  ) => {
    setReviews(
      reviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              reviewStatus: decision as ReviewItem["reviewStatus"],
              reviewNotes: notes,
              reviewedBy: "Dr. Sarah Johnson",
              reviewedDate: new Date().toISOString(),
              lastReviewDate: new Date().toISOString(),
            }
          : review
      )
    );
    setReviewNotes("");
    setReviewDecision("");
  };

  const pendingReviews = reviews.filter(
    (review) => review.reviewStatus === "pending"
  );
  const urgentReviews = reviews.filter(
    (review) => review.requiresUrgentReview && review.reviewStatus === "pending"
  );
  const completedReviews = reviews.filter(
    (review) => review.reviewStatus !== "pending"
  );
  const totalEstimatedTime = pendingReviews.reduce(
    (sum, review) => sum + review.estimatedReviewTime,
    0
  );

  return (
    <div className="space-y-6">
      {/* Urgent Reviews Alert */}
      {urgentReviews.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-semibold text-red-800">
                  Urgent Reviews Required
                </h4>
                <p className="text-sm text-red-700">
                  {urgentReviews.length} document
                  {urgentReviews.length > 1 ? "s" : ""} require
                  {urgentReviews.length === 1 ? "s" : ""} immediate supervisory
                  review.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Reviews
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting supervisor review
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {urgentReviews.length}
            </div>
            <p className="text-xs text-muted-foreground">
              High priority reviews
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstimatedTime}m</div>
            <p className="text-xs text-muted-foreground">
              To complete all reviews
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedReviews.length}</div>
            <p className="text-xs text-muted-foreground">
              Reviews completed today
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Reviews ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedReviews.length})
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="space-y-4">
            {pendingReviews.map((review) => {
              const statusInfo =
                statusConfig[review.reviewStatus as keyof typeof statusConfig];
              const StatusIcon = statusInfo.icon;

              return (
                <Card
                  key={review.id}
                  className={`${
                    review.requiresUrgentReview
                      ? "border-red-200 bg-red-50"
                      : ""
                  }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {review.documentTitle}
                          </h3>
                          <Badge
                            className={
                              priorityConfig[
                                review.priority as keyof typeof priorityConfig
                              ]
                            }>
                            {review.priority.toUpperCase()}
                          </Badge>
                          {review.requiresUrgentReview && (
                            <Badge variant="destructive">URGENT</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>
                              {review.patientName} ({review.patientId})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Provider: {review.providerName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Submitted:{" "}
                              {new Date(
                                review.submittedDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{review.estimatedReviewTime} min</span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <strong>Clinical Notes:</strong>{" "}
                          {review.clinicalNotes}
                        </div>
                        {review.treatmentGoals && (
                          <div className="text-sm">
                            <strong>Treatment Goals:</strong>
                            <ul className="list-disc list-inside ml-4 mt-1">
                              {review.treatmentGoals.map((goal, index) => (
                                <li key={index}>{goal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedReview(review)}>
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Supervisory Review</DialogTitle>
                              <DialogDescription>
                                Review and provide feedback on this clinical
                                document
                              </DialogDescription>
                            </DialogHeader>
                            {selectedReview && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="font-semibold mb-3">
                                      Document Information
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <strong>Title:</strong>{" "}
                                        {selectedReview.documentTitle}
                                      </div>
                                      <div>
                                        <strong>Type:</strong>{" "}
                                        {selectedReview.documentType}
                                      </div>
                                      <div>
                                        <strong>Patient:</strong>{" "}
                                        {selectedReview.patientName} (
                                        {selectedReview.patientId})
                                      </div>
                                      <div>
                                        <strong>Provider:</strong>{" "}
                                        {selectedReview.providerName}
                                      </div>
                                      <div>
                                        <strong>Submitted:</strong>{" "}
                                        {new Date(
                                          selectedReview.submittedDate
                                        ).toLocaleString()}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-3">
                                      Review Status
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div>
                                        <strong>Priority:</strong>{" "}
                                        {selectedReview.priority}
                                      </div>
                                      <div>
                                        <strong>Est. Review Time:</strong>{" "}
                                        {selectedReview.estimatedReviewTime}{" "}
                                        minutes
                                      </div>
                                      <div>
                                        <strong>Urgent Review:</strong>{" "}
                                        {selectedReview.requiresUrgentReview
                                          ? "Yes"
                                          : "No"}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-3">
                                    Clinical Content
                                  </h4>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm">
                                      {selectedReview.clinicalNotes}
                                    </p>
                                    {selectedReview.treatmentGoals && (
                                      <div className="mt-3">
                                        <strong className="text-sm">
                                          Treatment Goals:
                                        </strong>
                                        <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                                          {selectedReview.treatmentGoals.map(
                                            (goal, index) => (
                                              <li key={index}>{goal}</li>
                                            )
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">
                                      Review Decision
                                    </label>
                                    <Select
                                      value={reviewDecision}
                                      onValueChange={setReviewDecision}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select review decision" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="approved">
                                          Approve
                                        </SelectItem>
                                        <SelectItem value="needs_revision">
                                          Needs Revision
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                          Reject
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium mb-2 block">
                                      Review Notes & Feedback
                                    </label>
                                    <Textarea
                                      placeholder="Provide detailed feedback and recommendations..."
                                      value={reviewNotes}
                                      onChange={(e) =>
                                        setReviewNotes(e.target.value)
                                      }
                                      rows={4}
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    onClick={() =>
                                      handleReviewSubmit(
                                        selectedReview.id,
                                        reviewDecision,
                                        reviewNotes
                                      )
                                    }
                                    disabled={!reviewDecision || !reviewNotes}>
                                    <Send className="h-4 w-4 mr-1" />
                                    Submit Review
                                  </Button>
                                  <Button variant="outline">
                                    <FileText className="h-4 w-4 mr-1" />
                                    View Full Document
                                  </Button>
                                  <Button variant="outline">
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Contact Provider
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          View Document
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="space-y-4">
            {completedReviews.map((review) => {
              const statusInfo =
                statusConfig[review.reviewStatus as keyof typeof statusConfig];
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={review.id} className="border-green-200 bg-green-50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {review.documentTitle}
                          </h3>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {review.reviewStatus
                              .replace("_", " ")
                              .toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>
                              {review.patientName} ({review.patientId})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>Provider: {review.providerName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Reviewed:{" "}
                              {review.reviewedDate
                                ? new Date(
                                    review.reviewedDate
                                  ).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                        {review.reviewNotes && (
                          <div className="text-sm">
                            <strong>Review Notes:</strong> {review.reviewNotes}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Review Performance</CardTitle>
                <CardDescription>
                  Supervisory review metrics and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Review Time</span>
                    <span className="font-semibold">12 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reviews Completed Today</span>
                    <span className="font-semibold">
                      {completedReviews.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Approval Rate</span>
                    <span className="font-semibold">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Revision Rate</span>
                    <span className="font-semibold">12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Provider Performance</CardTitle>
                <CardDescription>Quality metrics by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dr. Emily Smith</span>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">92%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dr. James Wilson</span>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">88%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dr. Lisa Thompson</span>
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">76%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
