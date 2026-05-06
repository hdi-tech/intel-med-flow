import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AccountManagerLayout from "@/components/AccountManagerLayout";

interface ClientInfo {
  id: string;
  full_name: string | null;
  clinic_name: string | null;
  country: string | null;
  specialty: string | null;
  created_at: string;
  caseCount: number;
}

const AccountManagerClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: assignments } = await supabase.from("account_manager_assignments").select("client_id").eq("account_manager_id", user.id);
      const clientIds = (assignments || []).map(a => a.client_id);
      if (clientIds.length === 0) { setClients([]); setLoading(false); return; }

      const { data: profiles } = await supabase.from("profiles").select("*").in("id", clientIds);
      const { data: cases } = await supabase.from("cases").select("user_id").in("user_id", clientIds);
      const countMap: Record<string, number> = {};
      (cases || []).forEach(c => { countMap[c.user_id] = (countMap[c.user_id] || 0) + 1; });

      setClients((profiles || []).map(p => ({ ...p, caseCount: countMap[p.id] || 0 })));
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <AccountManagerLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">My Clients</h1>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : clients.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground text-sm font-sans">No clients assigned to you yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Clinic</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3">Specialty</th>
                <th className="px-5 py-3">Cases</th>
              </tr></thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-sans font-medium">{c.full_name || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{c.clinic_name || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{c.country || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{c.specialty || "—"}</td>
                    <td className="px-5 py-3 text-sm font-sans">{c.caseCount}</td>
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

export default AccountManagerClients;
