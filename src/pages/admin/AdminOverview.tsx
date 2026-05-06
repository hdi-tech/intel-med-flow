import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatCaseId, formatDate, ADMIN_NEEDS_ACTION_STATUSES, type CaseStatus } from "@/lib/caseHelpers";
import { FileText, AlertTriangle, Palette, DollarSign, Clock } from "lucide-react";

interface CaseRow {
  id: string;
  service_code: string | null;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  assigned_designer_id: string | null;
  services?: { name: string } | null;
}

const AdminOverview = () => {
  const [stats, setStats] = useState({ today: 0, awaiting: 0, inDesign: 0, revenue: 0, avgHours: 0 });
  const [incoming, setIncoming] = useState<CaseRow[]>([]);
  const [active, setActive] = useState<CaseRow[]>([]);
  const [alerts, setAlerts] = useState<{ id: string; message: string; type: "warning" | "info" }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

      const { data: allCases } = await supabase
        .from("cases")
        .select("id, service_code, status, created_at, updated_at, assigned_designer_id, services(name)")
        .order("created_at", { ascending: true });

      const cases = (allCases || []) as unknown as CaseRow[];
      const todayCases = cases.filter((c) => new Date(c.created_at) >= todayStart);
      
      // Use the shared ADMIN_NEEDS_ACTION_STATUSES for the incoming queue
      const awaitingAction = cases.filter((c) => ADMIN_NEEDS_ACTION_STATUSES.includes(c.status));
      const designCases = cases.filter((c) => ["in_design", "design_review"].includes(c.status));

      const { data: todayPayments } = await supabase
        .from("payments")
        .select("amount_usd")
        .eq("status", "paid")
        .gte("paid_at", todayStart.toISOString());

      const rev = (todayPayments || []).reduce((sum, p) => sum + Number(p.amount_usd), 0);

      const delivered = cases.filter((c) => c.status === "delivered");
      let avgH = 0;
      if (delivered.length > 0) {
        const totalH = delivered.reduce((sum, c) => {
          const diff = new Date(c.updated_at).getTime() - new Date(c.created_at).getTime();
          return sum + diff / 3600000;
        }, 0);
        avgH = Math.round(totalH / delivered.length);
      }

      // Needs Attention alerts
      const now = Date.now();
      const newAlerts: typeof alerts = [];

      // Cases in payment_verified (pending assignment) > 2 hours
      cases.filter((c) => c.status === "payment_verified").forEach((c) => {
        const hoursInStatus = (now - new Date(c.updated_at).getTime()) / 3600000;
        if (hoursInStatus > 2) {
          newAlerts.push({
            id: c.id,
            message: `⚠️ Case ${formatCaseId(c.id)} payment verified ${Math.round(hoursInStatus)}h ago — needs designer assignment`,
            type: "warning",
          });
        }
      });

      // Cases in payment_under_verification > 12 hours
      cases.filter((c) => c.status === "payment_under_verification").forEach((c) => {
        const hoursInStatus = (now - new Date(c.updated_at).getTime()) / 3600000;
        if (hoursInStatus > 12) {
          newAlerts.push({
            id: c.id,
            message: `⚠️ Case ${formatCaseId(c.id)} payment proof waiting review for ${Math.round(hoursInStatus)}h`,
            type: "warning",
          });
        }
      });

      // Cases in paid status > 12 hours (legacy)
      cases.filter((c) => c.status === "paid").forEach((c) => {
        const hoursInStatus = (now - new Date(c.updated_at).getTime()) / 3600000;
        if (hoursInStatus > 12) {
          newAlerts.push({
            id: c.id,
            message: `⚠️ Case ${formatCaseId(c.id)} paid ${Math.round(hoursInStatus)}h ago — not yet delivered`,
            type: "warning",
          });
        }
      });

      // Cases in under_review > 2 hours
      cases.filter((c) => c.status === "under_review").forEach((c) => {
        const hoursInStatus = (now - new Date(c.updated_at).getTime()) / 3600000;
        if (hoursInStatus > 2) {
          newAlerts.push({
            id: c.id,
            message: `⏳ Case ${formatCaseId(c.id)} waiting review for ${Math.round(hoursInStatus)}h`,
            type: "info",
          });
        }
      });

      setStats({ today: todayCases.length, awaiting: awaitingAction.length, inDesign: designCases.length, revenue: rev, avgHours: avgH });
      setIncoming(awaitingAction.slice(0, 20));
      setActive(designCases.slice(0, 20));
      setAlerts(newAlerts);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('admin-cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const statCards = [
    { label: "Cases Today", value: stats.today, icon: FileText, color: "text-blue-600" },
    { label: "Awaiting Action", value: stats.awaiting, icon: AlertTriangle, color: stats.awaiting > 0 ? "text-amber-600" : "text-gray-400" },
    { label: "In Design", value: stats.inDesign, icon: Palette, color: "text-indigo-600" },
    { label: "Revenue Today", value: `$${stats.revenue.toFixed(0)}`, icon: DollarSign, color: "text-emerald-600" },
    { label: "Avg Delivery (h)", value: stats.avgHours || "—", icon: Clock, color: "text-sky-600" },
  ];

  if (loading) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">Admin Overview</h1>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={18} className={s.color} />
              <span className="text-xs font-sans text-muted-foreground uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-xl font-semibold font-sans text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Needs Attention */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
          <h2 className="text-base font-serif text-amber-800 mb-3">⚠️ Needs Attention</h2>
          <div className="space-y-2">
            {alerts.map((a) => (
              <Link key={a.id} to={`/admin/cases/${a.id}`} className="block text-sm font-sans text-amber-700 hover:text-amber-900 hover:underline">
                {a.message}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Incoming Queue */}
      <div className="bg-card rounded-xl border border-border mb-6">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-serif text-foreground">Incoming Queue</h2>
          <p className="text-xs font-sans text-muted-foreground mt-1">Cases needing admin action: new submissions, payment review, pending assignment, design QC</p>
        </div>
        {incoming.length === 0 ? (
          <div className="p-8 text-center text-sm font-sans text-muted-foreground">No cases pending review.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide">
                <th className="px-5 py-3">Case ID</th><th className="px-5 py-3">Service</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3"></th>
              </tr></thead>
              <tbody>
                {incoming.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-mono">{formatCaseId(c.id)}</td>
                    <td className="px-5 py-3 text-sm font-sans">{c.service_code} — {(c.services as any)?.name || "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(c.created_at)}</td>
                    <td className="px-5 py-3"><Link to={`/admin/cases/${c.id}`} className="text-sm text-primary hover:underline font-sans">Review →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Cases */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-serif text-foreground">Active Cases — In Design</h2>
        </div>
        {active.length === 0 ? (
          <div className="p-8 text-center text-sm font-sans text-muted-foreground">No active design cases.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide">
                <th className="px-5 py-3">Case ID</th><th className="px-5 py-3">Service</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3"></th>
              </tr></thead>
              <tbody>
                {active.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-5 py-3 text-sm font-mono">{formatCaseId(c.id)}</td>
                    <td className="px-5 py-3 text-sm font-sans">{c.service_code} — {(c.services as any)?.name || "—"}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(c.updated_at)}</td>
                    <td className="px-5 py-3"><Link to={`/admin/cases/${c.id}`} className="text-sm text-primary hover:underline font-sans">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
