import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AccountManagerLayout from "@/components/AccountManagerLayout";
import { getGreeting, formatCaseId, formatDate, type CaseStatus } from "@/lib/caseHelpers";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { Users, FolderOpen, CreditCard, ArrowRight } from "lucide-react";

interface ClientInfo {
  id: string;
  full_name: string | null;
  clinic_name: string | null;
  country: string | null;
  caseCount: number;
}

interface CaseRow {
  id: string;
  service_code: string | null;
  status: CaseStatus;
  created_at: string;
  user_id: string;
  services?: { name: string } | null;
}

const AccountManagerOverview = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [recentCases, setRecentCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setProfile(prof);

      // Get assigned client IDs
      const { data: assignments } = await supabase.from("account_manager_assignments").select("client_id").eq("account_manager_id", user.id);
      const clientIds = (assignments || []).map(a => a.client_id);

      if (clientIds.length === 0) {
        setClients([]);
        setRecentCases([]);
        setLoading(false);
        return;
      }

      // Get client profiles
      const { data: clientProfiles } = await supabase.from("profiles").select("id, full_name, clinic_name, country").in("id", clientIds);

      // Get cases for these clients
      const { data: casesData } = await supabase
        .from("cases")
        .select("id, service_code, status, created_at, user_id, services(name)")
        .in("user_id", clientIds)
        .order("created_at", { ascending: false });

      const cases = (casesData || []) as unknown as CaseRow[];

      // Count cases per client
      const countMap: Record<string, number> = {};
      cases.forEach(c => { countMap[c.user_id] = (countMap[c.user_id] || 0) + 1; });

      setClients((clientProfiles || []).map(p => ({
        ...p,
        caseCount: countMap[p.id] || 0,
      })));

      setRecentCases(cases.slice(0, 10));
      setLoading(false);
    };
    load();
  }, [user]);

  const firstName = profile?.full_name?.split(" ")[0] || "Manager";

  if (loading) {
    return <AccountManagerLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AccountManagerLayout>;
  }

  return (
    <AccountManagerLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">{getGreeting()}, {firstName}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-blue-500" />
            <span className="text-xs font-sans text-muted-foreground uppercase tracking-wide">My Clients</span>
          </div>
          <p className="text-2xl font-semibold font-sans">{clients.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen size={16} className="text-teal-500" />
            <span className="text-xs font-sans text-muted-foreground uppercase tracking-wide">Total Cases</span>
          </div>
          <p className="text-2xl font-semibold font-sans">{recentCases.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={16} className="text-amber-500" />
            <span className="text-xs font-sans text-muted-foreground uppercase tracking-wide">Active Cases</span>
          </div>
          <p className="text-2xl font-semibold font-sans">{recentCases.filter(c => !["delivered", "paid", "draft"].includes(c.status)).length}</p>
        </div>
      </div>

      {/* My Clients */}
      <div className="bg-card rounded-xl border border-border mb-6">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-serif text-foreground">My Clients</h2>
          <Link to="/account-manager/clients" className="text-sm font-sans text-primary hover:underline">View all →</Link>
        </div>
        {clients.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm font-sans">No clients assigned yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Clinic</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3">Cases</th>
              </tr></thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-sans font-medium">{c.full_name || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{c.clinic_name || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{c.country || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans">{c.caseCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Cases */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-serif text-foreground">Recent Cases</h2>
          <Link to="/account-manager/cases" className="text-sm font-sans text-primary hover:underline">View all →</Link>
        </div>
        {recentCases.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm font-sans">No cases yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                <th className="px-5 py-3">Case ID</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3"></th>
              </tr></thead>
              <tbody>
                {recentCases.slice(0, 5).map(c => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-mono">{formatCaseId(c.id)}</td>
                    <td className="px-5 py-3 text-sm font-sans">{c.service_code} — {(c.services as any)?.name || "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-3"><Link to={`/admin/cases/${c.id}`} className="text-sm text-primary hover:underline font-sans">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AccountManagerLayout>
  );
};

export default AccountManagerOverview;
