import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatCaseId, formatDate, STATUS_ORDER, ADMIN_NEEDS_ACTION_STATUSES, ADMIN_ACTIVE_STATUSES, type CaseStatus } from "@/lib/caseHelpers";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CaseRow {
  id: string;
  service_code: string | null;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  assigned_designer_id: string | null;
  user_id: string;
  services?: { name: string; category_id: string | null } | null;
}

const AdminCases = () => {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [allStatusFilter, setAllStatusFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("cases")
        .select("id, service_code, status, created_at, updated_at, delivered_at, assigned_designer_id, user_id, services(name, category_id)")
        .order("created_at", { ascending: false });
      setCases((data || []) as unknown as CaseRow[]);
      setLoading(false);
    };
    load();
  }, []);

  const searchFilter = (c: CaseRow) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.id.toLowerCase().includes(q) || (c.service_code || "").toLowerCase().includes(q);
  };

  const needsAction = cases.filter((c) => ADMIN_NEEDS_ACTION_STATUSES.includes(c.status)).filter(searchFilter);
  const paymentVerification = cases.filter((c) => c.status === "payment_under_verification").filter(searchFilter);
  const activeCases = cases.filter((c) => ADMIN_ACTIVE_STATUSES.includes(c.status)).filter(searchFilter);
  const completedCases = cases.filter((c) => c.status === "delivered").filter(searchFilter)
    .sort((a, b) => new Date(b.delivered_at || b.updated_at).getTime() - new Date(a.delivered_at || a.updated_at).getTime());
  const allFiltered = cases.filter(searchFilter).filter((c) => allStatusFilter === "all" || c.status === allStatusFilter);

  const renderTable = (rows: CaseRow[], showDelivered = false) => (
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
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">{showDelivered ? "Delivered" : "Updated"}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-3 text-sm font-mono">{formatCaseId(c.id)}</td>
                  <td className="px-5 py-3 text-sm font-sans">{c.service_code} — {(c.services as any)?.name || "—"}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(c.created_at)}</td>
                  <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{showDelivered ? formatDate(c.delivered_at || c.updated_at) : formatDate(c.updated_at)}</td>
                  <td className="px-5 py-3"><Link to={`/admin/cases/${c.id}`} className="text-sm text-primary hover:underline font-sans">View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">All Cases</h1>

      <div className="relative max-w-sm mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search case ID or service code..."
          className="w-full border border-input rounded-lg pl-9 pr-3 py-2 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="needs_action" className="w-full">
        <div className="mb-4 -mx-4 px-4 overflow-x-auto md:mx-0 md:px-0 md:overflow-visible">
          <TabsList className="h-auto flex-wrap gap-1 md:gap-0 w-max md:w-auto">
            <TabsTrigger value="needs_action" className="font-sans whitespace-nowrap">Needs Action ({needsAction.length})</TabsTrigger>
            <TabsTrigger value="payment_verification" className="font-sans whitespace-nowrap">Payment Verification ({paymentVerification.length})</TabsTrigger>
            <TabsTrigger value="active" className="font-sans whitespace-nowrap">Active ({activeCases.length})</TabsTrigger>
            <TabsTrigger value="completed" className="font-sans whitespace-nowrap">Completed ({completedCases.length})</TabsTrigger>
            <TabsTrigger value="all" className="font-sans whitespace-nowrap">All ({cases.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="needs_action">{renderTable(needsAction)}</TabsContent>
        <TabsContent value="payment_verification">{renderTable(paymentVerification)}</TabsContent>
        <TabsContent value="active">{renderTable(activeCases)}</TabsContent>
        <TabsContent value="completed">{renderTable(completedCases, true)}</TabsContent>
        <TabsContent value="all">
          <div className="mb-4">
            <select className="border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background text-foreground"
              value={allStatusFilter} onChange={(e) => setAllStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          {renderTable(allFiltered)}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminCases;
