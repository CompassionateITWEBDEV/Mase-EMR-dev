"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users,
  Plus,
  Trash2,
  UserPlus,
  Shield,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
}

interface Provider {
  id: string;
  first_name: string;
  last_name: string;
  role?: string;
  specialization?: string;
}

interface CareTeamMember {
  id: string;
  provider_id: string;
  role: string;
  permissions: any;
  joined_at: string;
  is_active: boolean;
  providers: Provider;
}

interface CareTeam {
  id: string;
  patient_id: string;
  team_name: string;
  primary_provider_id: string;
  created_at: string;
  is_active: boolean;
  patients: Patient;
  primary_provider: Provider;
  care_team_members: CareTeamMember[];
}

interface CareTeamManagementProps {
  currentProviderId: string;
  canManageTeams: boolean;
}

export function CareTeamManagement({
  currentProviderId,
  canManageTeams,
}: CareTeamManagementProps) {
  const [careTeams, setCareTeams] = useState<CareTeam[]>([]);
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<CareTeam | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [newTeam, setNewTeam] = useState({
    patientId: "",
    teamName: "",
    primaryProviderId: "",
    members: [] as Array<{
      providerId: string;
      role: string;
      permissions: {
        read: boolean;
        write: boolean;
        admin: boolean;
      };
    }>,
  });

  const supabase = createClient();

  const fetchCareTeams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("care_teams")
        .select(
          `
          *,
          patients(
            id,
            first_name,
            last_name
          ),
          care_team_members(
            id,
            role,
            providers(
              id,
              first_name,
              last_name,
              specialization
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCareTeams(data || []);
    } catch (error) {
      console.error("Error fetching care teams:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const fetchAvailableProviders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("providers")
        .select("id, first_name, last_name, specialization")
        .eq("is_active", true);

      if (error) throw error;
      setAvailableProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
    }
  }, [supabase]);

  const fetchAvailablePatients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, first_name, last_name, date_of_birth")
        .eq("status", "active");

      if (error) throw error;
      setAvailablePatients(data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  }, [supabase]);

  useEffect(() => {
    fetchCareTeams();
    fetchAvailableProviders();
    fetchAvailablePatients();
  }, [fetchCareTeams, fetchAvailableProviders, fetchAvailablePatients]);

  const createCareTeam = async () => {
    if (!newTeam.patientId || !newTeam.teamName || !newTeam.primaryProviderId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Create the care team
      const { data: team, error: teamError } = await supabase
        .from("care_teams")
        .insert({
          patient_id: newTeam.patientId,
          team_name: newTeam.teamName,
          primary_provider_id: newTeam.primaryProviderId,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add team members
      if (newTeam.members.length > 0) {
        const members = newTeam.members.map((member) => ({
          care_team_id: team.id,
          provider_id: member.providerId,
          role: member.role,
          permissions: member.permissions,
        }));

        const { error: membersError } = await supabase
          .from("care_team_members")
          .insert(members);

        if (membersError) throw membersError;

        // Send notifications to new team members
        const notifications = newTeam.members.map((member) => ({
          patient_id: newTeam.patientId,
          care_team_id: team.id,
          recipient_id: member.providerId,
          sender_id: currentProviderId,
          notification_type: "case_assignment",
          title: `Care Team Assignment - ${newTeam.teamName}`,
          message: `You have been assigned to the care team for a new patient case.`,
          priority: "normal",
          action_url: `/patients/${newTeam.patientId}/communications`,
        }));

        await supabase.from("team_notifications").insert(notifications);
      }

      toast.success("Care team created successfully");
      setIsCreateTeamOpen(false);
      setNewTeam({
        patientId: "",
        teamName: "",
        primaryProviderId: "",
        members: [],
      });
      fetchCareTeams();
    } catch (error) {
      console.error("Error creating care team:", error);
      toast.error("Failed to create care team");
    }
  };

  const addTeamMember = (providerId: string, role: string) => {
    if (newTeam.members.some((m) => m.providerId === providerId)) {
      toast.error("Provider is already a team member");
      return;
    }

    setNewTeam((prev) => ({
      ...prev,
      members: [
        ...prev.members,
        {
          providerId,
          role,
          permissions: {
            read: true,
            write: role !== "consultant",
            admin: role === "primary",
          },
        },
      ],
    }));
  };

  const removeTeamMember = (providerId: string) => {
    setNewTeam((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.providerId !== providerId),
    }));
  };

  const updateMemberPermissions = (providerId: string, permissions: any) => {
    setNewTeam((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.providerId === providerId ? { ...m, permissions } : m
      ),
    }));
  };

  const deactivateTeam = async (teamId: string) => {
    try {
      const { error } = await supabase
        .from("care_teams")
        .update({ is_active: false })
        .eq("id", teamId);

      if (error) throw error;
      toast.success("Care team deactivated");
      fetchCareTeams();
    } catch (error) {
      console.error("Error deactivating team:", error);
      toast.error("Failed to deactivate team");
    }
  };

  const filteredTeams = careTeams.filter(
    (team) =>
      team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${team.patients.first_name} ${team.patients.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading care teams...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Search teams or patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        {canManageTeams && (
          <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Care Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Care Team</DialogTitle>
                <DialogDescription>
                  Assign a multidisciplinary team to collaborate on patient care
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient</Label>
                    <Select
                      value={newTeam.patientId}
                      onValueChange={(value) =>
                        setNewTeam((prev) => ({ ...prev, patientId: value }))
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePatients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.first_name} {patient.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Team Name</Label>
                    <Input
                      value={newTeam.teamName}
                      onChange={(e) =>
                        setNewTeam((prev) => ({
                          ...prev,
                          teamName: e.target.value,
                        }))
                      }
                      placeholder="Enter team name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Primary Provider</Label>
                  <Select
                    value={newTeam.primaryProviderId}
                    onValueChange={(value) =>
                      setNewTeam((prev) => ({
                        ...prev,
                        primaryProviderId: value,
                      }))
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.first_name} {provider.last_name} (
                          {provider.specialization || "N/A"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Team Members</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Team Member</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {availableProviders
                            .filter((p) => p.id !== newTeam.primaryProviderId)
                            .filter(
                              (p) =>
                                !newTeam.members.some(
                                  (m) => m.providerId === p.id
                                )
                            )
                            .map((provider) => (
                              <div
                                key={provider.id}
                                className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">
                                    {provider.first_name} {provider.last_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {provider.specialization || "N/A"}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      addTeamMember(provider.id, "secondary")
                                    }>
                                    Add as Secondary
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      addTeamMember(provider.id, "consultant")
                                    }>
                                    Add as Consultant
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {newTeam.members.map((member) => {
                      const provider = availableProviders.find(
                        (p) => p.id === member.providerId
                      );
                      if (!provider) return null;

                      return (
                        <div
                          key={member.providerId}
                          className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {provider.first_name[0]}
                                  {provider.last_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {provider.first_name} {provider.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {provider.specialization || "N/A"} •{" "}
                                  {member.role}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeTeamMember(member.providerId)
                              }>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${member.providerId}-read`}
                                checked={member.permissions.read}
                                onCheckedChange={(checked) =>
                                  updateMemberPermissions(member.providerId, {
                                    ...member.permissions,
                                    read: checked,
                                  })
                                }
                              />
                              <Label
                                htmlFor={`${member.providerId}-read`}
                                className="text-sm">
                                Read Access
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${member.providerId}-write`}
                                checked={member.permissions.write}
                                onCheckedChange={(checked) =>
                                  updateMemberPermissions(member.providerId, {
                                    ...member.permissions,
                                    write: checked,
                                  })
                                }
                              />
                              <Label
                                htmlFor={`${member.providerId}-write`}
                                className="text-sm">
                                Write Access
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${member.providerId}-admin`}
                                checked={member.permissions.admin}
                                onCheckedChange={(checked) =>
                                  updateMemberPermissions(member.providerId, {
                                    ...member.permissions,
                                    admin: checked,
                                  })
                                }
                              />
                              <Label
                                htmlFor={`${member.providerId}-admin`}
                                className="text-sm">
                                Admin Access
                              </Label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateTeamOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createCareTeam}>Create Team</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6">
        {filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Care Teams Found
              </h3>
              <p className="text-muted-foreground">
                {canManageTeams
                  ? "Create your first care team to get started."
                  : "No care teams match your search."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTeams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    <div>
                      <h3>{team.team_name}</h3>
                      <p className="text-sm font-normal text-muted-foreground">
                        Patient: {team.patients.first_name}{" "}
                        {team.patients.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {team.care_team_members.length + 1} members
                    </Badge>
                    {canManageTeams && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deactivateTeam(team.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  Primary Provider: {team.primary_provider.first_name}{" "}
                  {team.primary_provider.last_name} (
                  {team.primary_provider.specialization || "N/A"})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Team Members</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {team.care_team_members
                        .filter((member) => member.is_active)
                        .map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 p-3 border rounded-lg">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {member.providers.first_name[0]}
                                {member.providers.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {member.providers.first_name}{" "}
                                {member.providers.last_name}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {member.providers.specialization || "N/A"}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {member.role}
                                </Badge>
                                {member.permissions.admin && (
                                  <Shield className="h-3 w-3 text-primary" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/patients/${team.patient_id}/communications`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Team Communications
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
