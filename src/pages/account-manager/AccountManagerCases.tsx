import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AccountManagerLayout from "@/components/AccountManagerLayout";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatCaseId, formatDate, type CaseStatus } from "@/lib/caseHelpers";

interface CaseRow {
  id: string;
  service_code: string | null;
  status: CaseStatus;
  created_at: string;
  user_id: string;
  patient_ref: string | null;
  services?: { name: string } | null;
}

const AccountManagerCases = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: assignments } = await supabase.from("account_manager_assignments").select("client_id").eq("account_manager_id", user.id);
      const clientIds = (assignments || []).map(a => a.client_id);
      if (clientIds.length === 0) { setCases([]); setLoading(false); return; }

      const { data } = await supabase
        .from("cases")
        .select("id, service_code, status, created_at, user_id, patient_ref, services(name)")
        .in("user_id", clientIds)
        .order("created_at", { ascending: false });

      setCases((data || []) as unknown as CaseRow[]);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <AccountManagerLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">Cases</h1>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : cases.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm font-sans">No cases found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                <th className="px-5 py-3">Case ID</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3"></th>
              </tr></thead>
              <tbody>
                {cases.map(c => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-mono">{formatCaseId(c.id)}</td>
                    <td className="px-5 py-3 text-sm font-sans">{c.service_code} — {(c.services as any)?.name || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{c.patient_ref || "—"}</td>
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

export default AccountManagerCases;
