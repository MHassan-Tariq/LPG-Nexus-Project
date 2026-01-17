"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Users, Building2, FileText, Save, Loader2, Plus, Trash2, Camera, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  joinDate: string;
  notes: string;
  profileImage?: string; // Base64
}

interface TeamProfile {
  companyName: string;
  createdDate: string;
  history: string;
  teamSize: string;
  contactPerson: string;
  teamDescription: string;
  internalNotes: string;
  members: TeamMember[];
}

const initialProfile: TeamProfile = {
  companyName: "",
  createdDate: "",
  history: "",
  teamSize: "",
  contactPerson: "",
  teamDescription: "",
  internalNotes: "",
  members: [],
};

export function TeamClientForm() {
  const [profile, setProfile] = useState<TeamProfile>(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/team");
        if (res.ok) {
          const data = await res.json();
          if (data.teamProfile) {
            setProfile(prev => ({
              ...prev,
              ...data.teamProfile,
              history: data.teamProfile.history || "",
              teamDescription: data.teamProfile.teamDescription || "",
              internalNotes: data.teamProfile.internalNotes || "",
              members: data.teamProfile.members || []
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch team profile:", error);
        toast.error("Failed to load team information");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile.companyName.trim()) {
      toast.error("Company Name is required");
      return;
    }
    if (!profile.createdDate) {
      toast.error("Created Date is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamProfile: profile }),
      });

      if (res.ok) {
        toast.success("Team information saved successfully");
      } else {
        const errorData = await res.json();
        if (errorData.tip) {
          toast.info(errorData.tip, { duration: 10000 });
        }
        throw new Error(errorData.details || errorData.error || "Failed to save");
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof TeamProfile, value: any) => {
    if (typeof value === "string" && value.length > 2000 && (field === "history" || field === "teamDescription" || field === "internalNotes")) {
      return;
    }
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addMember = () => {
    const newMember: TeamMember = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      joinDate: "",
      notes: "",
    };
    setProfile(prev => ({ ...prev, members: [...prev.members, newMember] }));
  };

  const removeMember = (id: string) => {
    setProfile(prev => ({ ...prev, members: prev.members.filter(m => m.id !== id) }));
  };

  const handleMemberChange = (id: string, field: keyof TeamMember, value: string) => {
    setProfile(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, [field]: value } : m)
    }));
  };

  const handleImageUpload = async (id: string, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      const toastId = toast.loading("Uploading image...");
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64String }),
        });

        const data = await res.json();
        if (res.ok && data.url) {
          setProfile(prev => ({
            ...prev,
            members: prev.members.map(m => m.id === id ? { ...m, profileImage: data.url } : m)
          }));
          toast.success("Image uploaded", { id: toastId });
        } else {
          throw new Error(data.error || "Upload failed");
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        toast.error(error.message || "Failed to upload image", { id: toastId });
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="grid gap-6 max-w-5xl mx-auto w-full">
      {/* SECTION 1 — Company Information */}
      <Card className="rounded-[24px] border-slate-200/60 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-tight">Company Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Company Name *</Label>
              <Input 
                value={profile.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                placeholder="Enter company name"
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Company Created Date *</Label>
              <Input 
                type="date"
                value={profile.createdDate}
                onChange={(e) => handleChange("createdDate", e.target.value)}
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase">Company History</Label>
            <Textarea 
              value={profile.history}
              onChange={(e) => handleChange("history", e.target.value)}
              placeholder="Brief history of your company..."
              className="min-h-[140px] rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white p-4 text-sm resize-none"
            />
            <p className="text-[10px] text-slate-400 font-medium text-right">{(profile.history || "").length}/2000</p>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2 — Team Members */}
      <Card className="rounded-[24px] border-slate-200/60 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 bg-white px-6 py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-tight">Team Members</CardTitle>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            onClick={addMember}
            className="h-9 px-4 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 font-bold uppercase text-[10px] tracking-wider"
          >
            <Plus className="h-3 w-3 mr-1.5" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {profile.members.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
              <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No team members added yet</p>
              <Button 
                type="button" 
                variant="link" 
                onClick={addMember}
                className="text-blue-600 font-black uppercase text-[10px] mt-2 underline-offset-4"
              >
                Add your first member
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {profile.members.map((member, index) => (
                <div key={member.id} className="relative p-6 rounded-2xl border border-slate-100 bg-slate-50/30 group animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image Upload */}
                    <div className="shrink-0 flex flex-col items-center gap-2">
                       <div className="relative h-24 w-24 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-sm group/image">
                          {member.profileImage ? (
                            <img src={member.profileImage} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400">
                              <User className="h-10 w-10" />
                            </div>
                          )}
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Camera className="h-6 w-6 text-white" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => e.target.files && handleImageUpload(member.id, e.target.files[0])}
                            />
                          </label>
                       </div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Profile Photo</p>
                    </div>

                    <div className="flex-1 grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FullName *</Label>
                          <Input 
                            value={member.name}
                            onChange={(e) => handleMemberChange(member.id, "name", e.target.value)}
                            placeholder="John Doe"
                            className="h-10 rounded-lg bg-white border-slate-200 text-sm font-medium"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Joining *</Label>
                          <Input 
                            type="date"
                            value={member.joinDate}
                            onChange={(e) => handleMemberChange(member.id, "joinDate", e.target.value)}
                            className="h-10 rounded-lg bg-white border-slate-200 text-sm font-medium"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Notes</Label>
                        <Input 
                          value={member.notes}
                          onChange={(e) => handleMemberChange(member.id, "notes", e.target.value)}
                          placeholder="Role, skills, or special achievements..."
                          className="h-10 rounded-lg bg-white border-slate-200 text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={() => removeMember(member.id)}
                    className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-lg shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3 — Company Details & Team Summary */}
      <Card className="rounded-[24px] border-slate-200/60 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-tight">Support & Team Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Total Team Size (Count)</Label>
              <Input 
                type="number"
                value={profile.teamSize}
                onChange={(e) => handleChange("teamSize", e.target.value)}
                placeholder="e.g. 15"
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">Main Contact Person</Label>
              <Input 
                value={profile.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
                placeholder="Name of primary contact"
                className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase">Team Description</Label>
            <Textarea 
              value={profile.teamDescription}
              onChange={(e) => handleChange("teamDescription", e.target.value)}
              placeholder="Tell us about your team culture or focus..."
              className="min-h-[100px] rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white p-4 text-sm resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4 — Internal Notes */}
      <Card className="rounded-[24px] border-slate-200/60 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-base font-bold text-slate-800 uppercase tracking-tight">Internal Admin Notes</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase">Notes & Reminders</Label>
            <Textarea 
              value={profile.internalNotes}
              onChange={(e) => handleChange("internalNotes", e.target.value)}
              placeholder="Internal reminders, company notes, admin-only info..."
              className="min-h-[120px] rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white p-4 text-sm resize-none"
            />
            <p className="text-[10px] text-slate-400 font-medium text-right">{(profile.internalNotes || "").length}/2000</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2 pb-10">
        <Button 
          type="submit" 
          disabled={saving}
          className="h-12 px-10 rounded-xl bg-[#2544d6] hover:bg-[#1a35b0] text-white font-bold uppercase tracking-widest text-xs shadow-lg shadow-blue-500/10 transition-all active:scale-95"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Team Information
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
