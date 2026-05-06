import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AccountManagerLayout from "@/components/AccountManagerLayout";
import { formatDate } from "@/lib/caseHelpers";

const AccountManagerConsultations = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: assignments } = await supabase.from("account_manager_assignments").select("client_id").eq("account_manager_id", user.id);
      const clientIds = (assignments || []).map(a => a.client_id);
      if (clientIds.length === 0) { setConsultations([]); setLoading(false); return; }

      const { data } = await supabase
        .from("consultations")
        .select("*")
        .in("user_id", clientIds)
        .order("created_at", { ascending: false });

      setConsultations(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const statusColor: Record<string, string> = {
    pending_review: "bg-amber-100 text-amber-700",
    assigned: "bg-blue-100 text-blue-700",
    time_proposed: "bg-indigo-100 text-indigo-700",
    confirmed: "bg-green-100 text-green-700",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <AccountManagerLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">Consultations</h1>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : consultations.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm font-sans">No consultations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr></thead>
              <tbody>
                {consultations.map(c => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-sans font-medium">{c.client_name}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{c.service_interest || "—"}</td>
                    <td className="px-5 py-3"><span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${statusColor[c.status] || "bg-gray-100 text-gray-600"}`}>{c.status.replace(/_/g, " ")}</span></td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(c.created_at)}</td>
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

export default AccountManagerConsultations;
