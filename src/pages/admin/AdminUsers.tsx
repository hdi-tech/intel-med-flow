import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { formatDate } from "@/lib/caseHelpers";
import { Search, Edit2, Users as UsersIcon, Mail, X, Check, Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from "xlsx";

interface UserProfile {
  id: string;
  full_name: string | null;
  email?: string;
  phone_number?: string | null;
  clinic_name: string | null;
  country: string | null;
  specialty: string | null;
  created_at: string;
  caseCount?: number;
  roles: string[];
  managedCount?: number;
}

interface Invitation {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const ROLE_OPTIONS = [
  { value: "client", label: "Client" },
  { value: "designer", label: "Designer" },
  { value: "account_manager", label: "Account Manager" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-red-100 text-red-700",
  admin: "bg-purple-100 text-purple-700",
  account_manager: "bg-blue-100 text-blue-700",
  designer: "bg-teal-100 text-teal-700",
  client: "bg-gray-100 text-gray-600",
};

const AdminUsers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Edit role modal
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);

  // Account manager assignment
  const [assignClients, setAssignClients] = useState<string[]>([]);
  const [allClients, setAllClients] = useState<{ id: string; full_name: string | null; clinic_name: string | null }[]>([]);
  const [clientSearch, setClientSearch] = useState("");

  // Designer invitation
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNotes, setInviteNotes] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const load = async () => {
    // Fetch ALL profiles (source of truth) — never filter by role
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch all roles and build a map
    const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");
    const roleMap: Record<string, string[]> = {};
    (allRoles || []).forEach((r) => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    const { data: cases } = await supabase.from("cases").select("user_id");
    const countMap: Record<string, number> = {};
    (cases || []).forEach((c) => { countMap[c.user_id] = (countMap[c.user_id] || 0) + 1; });

    // Get AM assignment counts
    const { data: assignments } = await supabase.from("account_manager_assignments").select("account_manager_id");
    const amCountMap: Record<string, number> = {};
    (assignments || []).forEach((a) => { amCountMap[a.account_manager_id] = (amCountMap[a.account_manager_id] || 0) + 1; });

    setUsers(
      (profiles || []).map((p: any) => ({
        ...p,
        email: p.email || "",
        phone_number: p.phone_number || null,
        caseCount: countMap[p.id] || 0,
        roles: roleMap[p.id] && roleMap[p.id].length > 0 ? roleMap[p.id] : ["client"],
        managedCount: amCountMap[p.id] || 0,
      }))
    );

    // Load invitations
    const { data: invites } = await supabase.from("designer_invitations").select("*").order("created_at", { ascending: false });
    setInvitations((invites || []) as Invitation[]);

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEditRole = async (u: UserProfile) => {
    setEditUser(u);
    setNewRole(u.roles[0] || "client");
    setClientSearch("");
    setAllClients([]);
    setAssignClients([]);

    // Load all clients (users with client role) for AM assignment
    // Fetch in parallel
    const [rolesRes, existingRes] = await Promise.all([
      supabase.from("user_roles").select("user_id").eq("role", "client"),
      supabase.from("account_manager_assignments").select("client_id").eq("account_manager_id", u.id),
    ]);

    const clientIds = (rolesRes.data || []).map(r => r.user_id);
    if (clientIds.length > 0) {
      // Fetch profiles in batches if needed (handle >1000)
      const batchSize = 500;
      const allProfiles: { id: string; full_name: string | null; clinic_name: string | null }[] = [];
      for (let i = 0; i < clientIds.length; i += batchSize) {
        const batch = clientIds.slice(i, i + batchSize);
        const { data } = await supabase.from("profiles").select("id, full_name, clinic_name").in("id", batch);
        if (data) allProfiles.push(...data);
      }
      // Sort alphabetically
      allProfiles.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
      setAllClients(allProfiles);
    }

    setAssignClients((existingRes.data || []).map(a => a.client_id));
  };

  const handleSaveRole = async () => {
    if (!editUser || !user) return;
    setSaving(true);

    try {
      // Remove existing roles for user
      await supabase.from("user_roles").delete().eq("user_id", editUser.id);
      // Insert new role
      await supabase.from("user_roles").insert({ user_id: editUser.id, role: newRole as any });

      // Handle AM assignments
      if (newRole === "account_manager") {
        // Remove old assignments
        await supabase.from("account_manager_assignments").delete().eq("account_manager_id", editUser.id);
        // Insert new
        if (assignClients.length > 0) {
          // First remove these clients from other managers
          for (const clientId of assignClients) {
            await supabase.from("account_manager_assignments").delete().eq("client_id", clientId);
          }
          await supabase.from("account_manager_assignments").insert(
            assignClients.map(clientId => ({
              account_manager_id: editUser.id,
              client_id: clientId,
              assigned_by: user.id,
            }))
          );
        }
      }

      toast({ title: "Role updated", description: `${editUser.full_name}'s role changed to ${newRole}` });
      setEditUser(null);
      load();
    } catch (err) {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleInviteDesigner = async () => {
    if (!inviteName || !inviteEmail || !user) return;
    setInviteSending(true);

    const { data, error } = await supabase.from("designer_invitations").insert({
      email: inviteEmail,
      name: inviteName,
      invited_by: user.id,
      notes: inviteNotes || null,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setInviteSending(false);
      return;
    }

    // Send invitation email
    await supabase.functions.invoke("send-email", {
      body: {
        template: "designer-invitation",
        to: inviteEmail,
        data: {
          name: inviteName,
          signupLink: `${window.location.origin}/designer-signup?token=${data.token}`,
        },
      },
    });

    toast({ title: "Invitation sent", description: `Invitation sent to ${inviteEmail}` });
    setShowInvite(false);
    setInviteName("");
    setInviteEmail("");
    setInviteNotes("");
    setInviteSending(false);
    load();
  };

  const handleResendInvite = async (inv: Invitation) => {
    // Update expiry
    await supabase.from("designer_invitations")
      .update({ status: "pending", expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      .eq("id", inv.id);

    const { data } = await supabase.from("designer_invitations").select("token").eq("id", inv.id).single();

    await supabase.functions.invoke("send-email", {
      body: {
        template: "designer-invitation",
        to: inv.email,
        data: {
          name: inv.name,
          signupLink: `${window.location.origin}/designer-signup?token=${data?.token}`,
        },
      },
    });

    toast({ title: "Invitation resent" });
    load();
  };

  const handleCancelInvite = async (id: string) => {
    await supabase.from("designer_invitations").delete().eq("id", id);
    toast({ title: "Invitation cancelled" });
    load();
  };

  const handleExportExcel = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = users.map(u => ({
      "Full Name": u.full_name || "",
      "Email": u.email || "",
      "Phone Number": u.phone_number || "",
      "Specialty": u.specialty || "",
      "Country": u.country || "",
      "Role": u.roles.join(", "),
      "Join Date": formatDate(u.created_at),
      "Total Cases": u.caseCount || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `HDI-Users-${today}.xlsx`);
  };

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && !u.roles.includes(roleFilter)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.full_name || "").toLowerCase().includes(q) || (u.clinic_name || "").toLowerCase().includes(q);
  });

  const filteredClients = allClients.filter(c => {
    if (!clientSearch) return true;
    const q = clientSearch.toLowerCase();
    return (c.full_name || "").toLowerCase().includes(q) || (c.clinic_name || "").toLowerCase().includes(q);
  });

  return (
    <AdminLayout>
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-serif text-foreground">Users</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button onClick={handleExportExcel} className="flex items-center gap-2 border border-input text-foreground px-4 py-2 rounded-lg text-sm font-sans font-medium hover:bg-muted whitespace-nowrap">
            <Download size={16} /> Export to Excel
          </button>
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-sans font-medium hover:bg-primary/90 whitespace-nowrap">
            <Mail size={16} /> Invite Designer
          </button>
        </div>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="mb-4">
          <TabsTrigger value="users" className="font-sans">All Users ({users.length})</TabsTrigger>
          <TabsTrigger value="invitations" className="font-sans">Pending Invites ({invitations.filter(i => i.status === "pending").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative max-w-sm flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search by name or clinic..." className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm font-sans bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="client">Clients</option>
              <option value="designer">Designers</option>
              <option value="account_manager">Account Managers</option>
              <option value="admin">Admins</option>
              <option value="super_admin">Super Admins</option>
            </select>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {loading ? (
              <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                    <th className="px-5 py-3">Full Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Specialty</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Info</th>
                    <th className="px-5 py-3"></th>
                  </tr></thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-5 py-3 text-sm font-sans font-medium">{u.full_name || "—"}</td>
                        <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{u.email || "—"}</td>
                        <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{u.phone_number || "—"}</td>
                        <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{u.specialty || "—"}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map(r => (
                              <span key={r} className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${ROLE_COLORS[r] || ROLE_COLORS.client}`}>
                                {r.replace("_", " ")}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(u.created_at)}</td>
                        <td className="px-5 py-3 text-sm font-sans text-muted-foreground">
                          {u.roles.includes("account_manager") && <span className="text-blue-600 text-xs">Managing {u.managedCount} clients</span>}
                          {u.roles.includes("client") && <span className="text-xs">{u.caseCount} cases</span>}
                          {u.roles.includes("designer") && <span className="text-teal-600 text-xs">{u.caseCount} assigned</span>}
                        </td>
                        <td className="px-5 py-3">
                          {user?.id === u.id ? (
                            <span
                              title="You cannot change your own role. Ask another super_admin to make this change."
                              className="text-sm text-muted-foreground font-sans flex items-center gap-1 cursor-not-allowed opacity-60"
                            >
                              <Edit2 size={14} /> Edit Role
                            </span>
                          ) : (
                            <button onClick={() => openEditRole(u)} className="text-sm text-primary hover:underline font-sans flex items-center gap-1">
                              <Edit2 size={14} /> Edit Role
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="invitations">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {invitations.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm font-sans">No invitations sent yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Invited</th>
                    <th className="px-5 py-3">Expires</th>
                    <th className="px-5 py-3"></th>
                  </tr></thead>
                  <tbody>
                    {invitations.map((inv) => {
                      const isExpired = new Date(inv.expires_at) < new Date() && inv.status === "pending";
                      const statusLabel = inv.status === "accepted" ? "Accepted" : isExpired ? "Expired" : "Pending";
                      const statusColor = inv.status === "accepted" ? "bg-green-100 text-green-700" : isExpired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700";
                      return (
                        <tr key={inv.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-5 py-3 text-sm font-sans font-medium">{inv.name}</td>
                          <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{inv.email}</td>
                          <td className="px-5 py-3"><span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${statusColor}`}>{statusLabel}</span></td>
                          <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(inv.created_at)}</td>
                          <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(inv.expires_at)}</td>
                          <td className="px-5 py-3 flex gap-2">
                            {inv.status !== "accepted" && (
                              <>
                                <button onClick={() => handleResendInvite(inv)} className="text-xs text-primary hover:underline font-sans">Resend</button>
                                <button onClick={() => handleCancelInvite(inv.id)} className="text-xs text-destructive hover:underline font-sans">Cancel</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Role Modal */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Role — {editUser?.full_name || "User"}</DialogTitle>
            <DialogDescription>Change this user's role and permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

             {newRole === "account_manager" && (
              <div>
                <label className="block text-sm font-medium mb-1">Assign Client Accounts</label>
                <input
                  type="text"
                  placeholder="Search clients by name or clinic..."
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background mb-2"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                <div className="max-h-60 overflow-y-auto border border-input rounded-lg divide-y">
                  {allClients.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">No clients found</div>
                  ) : filteredClients.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">No clients match "{clientSearch}"</div>
                  ) : (
                    filteredClients.map(c => (
                      <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={assignClients.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) setAssignClients(prev => [...prev, c.id]);
                            else setAssignClients(prev => prev.filter(id => id !== c.id));
                          }}
                          className="rounded"
                        />
                        <span className="font-medium">{c.full_name || "—"}</span>
                        {c.clinic_name && <span className="text-muted-foreground">({c.clinic_name})</span>}
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{assignClients.length} client(s) selected</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm border border-input rounded-lg hover:bg-muted/50">Cancel</button>
              <button onClick={handleSaveRole} disabled={saving} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                {saving ? "Saving..." : "Save Role"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Designer Modal */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Designer</DialogTitle>
            <DialogDescription>Send an invitation email to a new designer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input type="email" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" rows={2} value={inviteNotes} onChange={(e) => setInviteNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm border border-input rounded-lg hover:bg-muted/50">Cancel</button>
              <button onClick={handleInviteDesigner} disabled={inviteSending || !inviteName || !inviteEmail} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                {inviteSending ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
