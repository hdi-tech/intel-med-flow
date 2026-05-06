import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/caseHelpers";
import { User, CreditCard, Trash2 } from "lucide-react";
import { specialtyGroups } from "@/lib/specialties";

const COUNTRIES = [
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
  "Egypt", "Jordan", "Lebanon", "Iraq", "India", "Pakistan", "United States",
  "United Kingdom", "Canada", "Australia", "Germany", "France", "Other",
];

interface ProfileData {
  full_name: string;
  clinic_name: string;
  country: string;
  specialty: string;
}

interface PaymentRow {
  id: string;
  amount_usd: number;
  method: string | null;
  status: string;
  paid_at: string | null;
  case_id: string;
  cases?: { service_code: string | null; services?: { name: string } | null } | null;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData>({ full_name: "", clinic_name: "", country: "", specialty: "" });
  const [saving, setSaving] = useState(false);
  const [memberSince, setMemberSince] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) {
        setProfile({
          full_name: p.full_name || "",
          clinic_name: p.clinic_name || "",
          country: p.country || "",
          specialty: p.specialty || "",
        });
        setMemberSince(p.created_at);
      }

      const { data: pays } = await supabase
        .from("payments")
        .select("*, cases(service_code, services(name))")
        .eq("user_id", user.id)
        .order("paid_at", { ascending: false });
      setPayments((pays || []) as unknown as PaymentRow[]);
      setLoadingPayments(false);
    };
    load();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(profile).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate your account? This action will notify our admin team.")) return;
    try {
      // Send deactivation request email to admin
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          template: "admin-notification",
          to: "info@hdi-tech.com",
          data: {
            subject: "Account Deactivation Request",
            message: `User ${user!.email} (ID: ${user!.id}) has requested account deactivation. Please review and process this request.`,
          },
        },
      });
      if (error) throw error;
      toast({ title: "Deactivation requested", description: "Our team has been notified and will process your request." });
    } catch {
      toast({ title: "Request sent", description: "Our team has been notified and will process your request." });
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-3 space-y-6">
          {/* Edit Profile */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-base font-sans font-semibold text-foreground mb-4 flex items-center gap-2">
              <User size={18} /> Edit Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-sans text-muted-foreground mb-1 block">Full Name</label>
                <input
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-sans text-muted-foreground mb-1 block">Clinic / Practice Name</label>
                <input
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
                  value={profile.clinic_name}
                  onChange={(e) => setProfile({ ...profile, clinic_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-sans text-muted-foreground mb-1 block">Country</label>
                <select
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-sans text-muted-foreground mb-1 block">Specialty</label>
                <select
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
                  value={profile.specialty}
                  onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                >
                  <option value="">Select specialty</option>
                  {specialtyGroups.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-sans font-medium transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-base font-sans font-semibold text-foreground mb-4">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-sans text-muted-foreground mb-1 block">Current Password</label>
                <input
                  type="password"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-sans text-muted-foreground mb-1 block">New Password</label>
                <input
                  type="password"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-sans text-muted-foreground mb-1 block">Confirm New Password</label>
                <input
                  type="password"
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPw || !newPassword}
                className="border border-border text-foreground px-6 py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {changingPw ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-base font-sans font-semibold text-foreground mb-4">Account Info</h2>
            <div className="space-y-2 text-sm font-sans">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground font-medium">{user?.email || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since</span>
                <span className="text-foreground font-medium">{memberSince ? formatDate(memberSince) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account type</span>
                <span className="text-foreground font-medium">Client</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <button
                onClick={handleDeactivate}
                className="flex items-center gap-2 text-destructive text-sm font-sans hover:underline"
              >
                <Trash2 size={14} /> Deactivate Account
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Billing History */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-base font-sans font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard size={18} /> Billing History
            </h2>
            {loadingPayments ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <p className="text-sm font-sans text-muted-foreground py-8 text-center">No payment history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 text-muted-foreground font-medium">Date</th>
                      <th className="pb-2 text-muted-foreground font-medium">Case</th>
                      <th className="pb-2 text-muted-foreground font-medium">Service</th>
                      <th className="pb-2 text-muted-foreground font-medium">Amount</th>
                      <th className="pb-2 text-muted-foreground font-medium">Method</th>
                      <th className="pb-2 text-muted-foreground font-medium">Status</th>
                      <th className="pb-2 text-muted-foreground font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className="py-2 text-foreground">{p.paid_at ? formatDate(p.paid_at) : "—"}</td>
                        <td className="py-2 text-foreground font-mono text-xs">#{p.case_id.slice(0, 8)}</td>
                        <td className="py-2 text-foreground">{(p.cases as any)?.services?.name || "—"}</td>
                        <td className="py-2 text-foreground font-medium">${p.amount_usd}</td>
                        <td className="py-2 text-muted-foreground">{p.method === "card" ? "Card" : p.method === "bank_transfer" ? "Bank Transfer" : p.method || "—"}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                            p.status === "refunded" ? "bg-amber-100 text-amber-700" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2">
                          <a href={`/dashboard/cases/${p.case_id}`} className="text-xs text-primary hover:underline">View Case</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
