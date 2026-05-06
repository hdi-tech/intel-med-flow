import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AccountManagerLayout from "@/components/AccountManagerLayout";
import { formatDate, formatCaseId } from "@/lib/caseHelpers";

const AccountManagerPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: assignments } = await supabase.from("account_manager_assignments").select("client_id").eq("account_manager_id", user.id);
      const clientIds = (assignments || []).map(a => a.client_id);
      if (clientIds.length === 0) { setPayments([]); setLoading(false); return; }

      const { data } = await supabase
        .from("payments")
        .select("*")
        .in("user_id", clientIds)
        .order("paid_at", { ascending: false });

      setPayments(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
    refunded: "bg-red-100 text-red-700",
  };

  return (
    <AccountManagerLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">Payments</h1>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm font-sans">No payments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                <th className="px-5 py-3">Case</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-mono">{formatCaseId(p.case_id)}</td>
                    <td className="px-5 py-3 text-sm font-sans font-medium">${p.amount_usd}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{p.method || "—"}</td>
                    <td className="px-5 py-3"><span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${statusColor[p.status] || ""}`}>{p.status}</span></td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{p.paid_at ? formatDate(p.paid_at) : "—"}</td>
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

export default AccountManagerPayments;
