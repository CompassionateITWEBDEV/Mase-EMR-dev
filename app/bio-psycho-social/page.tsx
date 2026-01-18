"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, Heart, Users, FileText } from "lucide-react"
import { toast } from "sonner"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function BioPsychoSocialPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64">
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bio-Psycho-Social Assessment</h1>
          <p className="text-muted-foreground">Comprehensive clinical assessment per SAMHSA standards</p>
        </div>

        <Tabs defaultValue="biological">
          <TabsList>
            <TabsTrigger value="biological">Biological</TabsTrigger>
            <TabsTrigger value="psychological">Psychological</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="cultural">Cultural/Spiritual</TabsTrigger>
          </TabsList>

          <TabsContent value="biological">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Biological Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Medical History</Label>
                  <Textarea placeholder="Chronic conditions, surgeries, hospitalizations..." rows={4} />
                </div>
                <div>
                  <Label>Current Medications</Label>
                  <Textarea placeholder="List all current medications..." rows={3} />
                </div>
                <div>
                  <Label>Substance Use Impact on Health</Label>
                  <Textarea placeholder="Physical health consequences of substance use..." rows={3} />
                </div>
                <div>
                  <Label>Sleep Patterns</Label>
                  <Textarea placeholder="Quality, duration, disturbances..." rows={2} />
                </div>
                <div>
                  <Label>Nutrition & Diet</Label>
                  <Textarea placeholder="Eating patterns, appetite, concerns..." rows={2} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="psychological">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Psychological Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mental Health History</Label>
                  <Textarea placeholder="Diagnoses, symptoms, treatment history..." rows={4} />
                </div>
                <div>
                  <Label>Current Mood & Affect</Label>
                  <Textarea placeholder="Depression, anxiety, emotional state..." rows={3} />
                </div>
                <div>
                  <Label>Coping Mechanisms</Label>
                  <Textarea placeholder="How patient deals with stress and challenges..." rows={3} />
                </div>
                <div>
                  <Label>Cognitive Functioning</Label>
                  <Textarea placeholder="Memory, concentration, decision-making abilities..." rows={2} />
                </div>
                <div>
                  <Label>Trauma History</Label>
                  <Textarea placeholder="PTSD, childhood trauma, adverse experiences..." rows={3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Social Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Family Relationships</Label>
                  <Textarea placeholder="Family dynamics, support, conflicts..." rows={3} />
                </div>
                <div>
                  <Label>Social Support Network</Label>
                  <Textarea placeholder="Friends, community connections, isolation..." rows={3} />
                </div>
                <div>
                  <Label>Housing Situation</Label>
                  <Textarea placeholder="Stable housing, homelessness risk, living arrangements..." rows={2} />
                </div>
                <div>
                  <Label>Employment Status</Label>
                  <Textarea placeholder="Current employment, job history, financial stability..." rows={2} />
                </div>
                <div>
                  <Label>Legal Issues</Label>
                  <Textarea placeholder="Court involvement, probation, pending charges..." rows={2} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cultural">
            <Card>
              <CardHeader>
                <CardTitle>Cultural & Spiritual Factors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Cultural Background</Label>
                  <Textarea placeholder="Cultural identity, traditions, values..." rows={3} />
                </div>
                <div>
                  <Label>Spiritual/Religious Beliefs</Label>
                  <Textarea placeholder="Role of spirituality in recovery..." rows={3} />
                </div>
                <div>
                  <Label>Cultural Barriers to Treatment</Label>
                  <Textarea placeholder="Language, stigma, cultural considerations..." rows={2} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Save Draft</Button>
          <Button onClick={() => toast.success("Bio-Psycho-Social assessment completed")}>
            <FileText className="mr-2 h-4 w-4" />
            Complete Assessment
          </Button>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}
