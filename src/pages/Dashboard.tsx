import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth, getLoginRedirect } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { getGreeting, formatCaseId, formatDate, STATUS_CONFIG, type CaseStatus } from "@/lib/caseHelpers";
import { Plus, FileText, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

interface CaseRow {
  id: string;
  service_code: string | null;
  status: CaseStatus;
  created_at: string;
  services?: { name: string } | null;
}

interface CategoryTrial {
  name: string;
  id: string;
}

const Dashboard = () => {
  const { user, roles, defaultRole, isClient, isAdmin, isSuperAdmin, isDesigner, isAccountManager } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, delivered: 0, pendingAction: 0 });
  const [trialCategories, setTrialCategories] = useState<CategoryTrial[]>([]);
  const [loading, setLoading] = useState(true);

  // Role-aware redirect: only true clients should see this page.
  // Anyone else (designer/admin/super_admin/account_manager) gets routed
  // to their own workspace. Multi-role users go through the workspace selector.
  if (user && !isClient) {
    const target = getLoginRedirect(roles, defaultRole);
    if (target !== "/dashboard") return <Navigate to={target} replace />;
  }

  useEffect(() => {
    if (!user) return;
    if (!isClient) return; // skip data load when we're about to redirect
    const load = async () => {
      // Fetch profile
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setProfile(prof);

      // Fetch cases with service name
      const { data: casesData } = await supabase
        .from("cases")
        .select("id, service_code, status, created_at, services(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const typedCases = (casesData || []) as unknown as CaseRow[];
      setCases(typedCases);

      // Stats
      const all = typedCases;
      const actionStatuses: CaseStatus[] = ["design_review", "revision_requested", "awaiting_payment", "pending_client_approval"];
      setStats({
        total: all.length,
        inProgress: all.filter((c) => !["draft", "delivered", "paid"].includes(c.status)).length,
        delivered: all.filter((c) => c.status === "delivered").length,
        pendingAction: all.filter((c) => actionStatuses.includes(c.status)).length,
      });

      // Free trials - get all categories, subtract used
      const { data: categories } = await supabase.from("categories").select("id, name").eq("is_visible", true).order("sort_order");
      const { data: usedTrials } = await supabase.from("free_trials").select("service_category").eq("user_id", user.id);
      const usedCats = new Set((usedTrials || []).map((t) => t.service_category));
      setTrialCategories((categories || []).filter((c) => !usedCats.has(c.name)));

      setLoading(false);
    };
    load();

    // Realtime subscription for case status changes
    const channel = supabase
      .channel('dashboard-cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `user_id=eq.${user.id}` }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const firstName = profile?.full_name?.split(" ")[0] || "Doctor";

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const statCards = [
    { label: "Total Cases", value: stats.total, icon: FileText, color: "text-blue-600" },
    { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-indigo-600" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Pending Action", value: stats.pendingAction, icon: AlertTriangle, color: stats.pendingAction > 0 ? "text-amber-600" : "text-gray-400" },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-serif text-foreground">
          {getGreeting()}, Dr. {firstName}
        </h1>
        <Link
          to="/dashboard/submit"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors"
        >
          <Plus size={16} />
          Submit a new case
        </Link>
      </div>

      {/* Free trials banner */}
      {trialCategories.length > 0 && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-sm font-semibold font-sans text-emerald-800 mb-2">
            🎉 You have free trial cases available
          </h3>
          <div className="flex flex-wrap gap-2">
            {trialCategories.map((cat) => (
              <Link
                key={cat.id}
                to="/dashboard/submit"
                className="inline-flex items-center gap-1 text-xs font-sans text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-full transition-colors"
              >
                {cat.name}
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-2">
              <s.icon size={20} className={s.color} />
              <span className="text-xs font-sans text-muted-foreground uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold font-sans text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent cases */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-serif text-foreground">Recent Cases</h2>
          <Link to="/dashboard/cases" className="text-sm font-sans text-primary hover:underline">
            View all cases →
          </Link>
        </div>

        {cases.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground font-sans text-sm mb-4">No cases submitted yet.</p>
            <Link
              to="/dashboard/submit"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium font-sans transition-colors"
            >
              <Plus size={16} />
              Submit your first case
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide">
                  <th className="px-5 py-3">Case ID</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => {
                  const cfg = STATUS_CONFIG[c.status];
                  return (
                    <tr
                      key={c.id}
                      className={`border-t border-border hover:bg-muted/50 transition-colors ${
                        cfg?.clientAction ? `border-l-4 ${cfg.border}` : ""
                      }`}
                    >
                      <td className="px-5 py-3 text-sm font-mono font-sans text-foreground">{formatCaseId(c.id)}</td>
                      <td className="px-5 py-3 text-sm font-sans text-foreground">
                        {c.service_code} — {(c.services as any)?.name || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-3">
                        <Link to={`/dashboard/cases/${c.id}`} className="text-sm font-sans text-primary hover:underline">
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
