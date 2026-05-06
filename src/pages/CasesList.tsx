import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatCaseId, formatDate, STATUS_CONFIG, type CaseStatus } from "@/lib/caseHelpers";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CaseRow {
  id: string;
  service_code: string | null;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  services?: { name: string } | null;
}

const CasesList = () => {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("cases")
        .select("id, service_code, status, created_at, updated_at, delivered_at, services(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCases((data || []) as unknown as CaseRow[]);
      setLoading(false);
    };
    load();
  }, [user]);

  const searchFilter = (c: CaseRow) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.id.toLowerCase().includes(q) || (c.service_code || "").toLowerCase().includes(q);
  };

  const activeCases = cases.filter((c) => c.status !== "delivered").filter(searchFilter);
  const completedCases = cases.filter((c) => c.status === "delivered").filter(searchFilter)
    .sort((a, b) => new Date(b.delivered_at || b.updated_at).getTime() - new Date(a.delivered_at || a.updated_at).getTime());

  const renderTable = (rows: CaseRow[]) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {loading ? (
        <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground text-sm font-sans">No cases found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                <th className="px-5 py-3">Case ID</th>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const cfg = STATUS_CONFIG[c.status];
                return (
                  <tr key={c.id} className={`border-t border-border hover:bg-muted/30 transition-colors cursor-pointer ${cfg?.clientAction ? `border-l-4 ${cfg.border}` : ""}`}
                    onClick={() => window.location.href = `/dashboard/cases/${c.id}`}
                  >
                    <td className="px-5 py-3 text-sm font-mono text-foreground">{formatCaseId(c.id)}</td>
                    <td className="px-5 py-3 text-sm font-sans text-foreground">{c.service_code}</td>
                    <td className="px-5 py-3 text-sm font-sans text-foreground">{(c.services as any)?.name || "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(c.updated_at)}</td>
                    <td className="px-5 py-3">
                      <Link to={`/dashboard/cases/${c.id}`} className="text-sm font-sans text-primary hover:underline">View →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-serif text-foreground">My Cases</h1>
        <Link to="/dashboard/submit" className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors">
          + Submit Case
        </Link>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search by Case ID or service code..."
          className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="font-sans">Active ({activeCases.length})</TabsTrigger>
          <TabsTrigger value="completed" className="font-sans">Completed ({completedCases.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">{renderTable(activeCases)}</TabsContent>
        <TabsContent value="completed">{renderTable(completedCases)}</TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default CasesList;
