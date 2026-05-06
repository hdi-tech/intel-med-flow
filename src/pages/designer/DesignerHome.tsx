import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DesignerLayout from "@/components/DesignerLayout";
import DesignerStatusBadge from "@/components/dashboard/DesignerStatusBadge";
import { formatCaseId, formatDate, getGreeting, getDesignerStatusLabel, DESIGNER_ACTIVE_STATUSES, type CaseStatus } from "@/lib/caseHelpers";
import { Clock, CheckCircle2, ArrowRight, Package, PackageCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CaseRow {
  id: string;
  service_code: string | null;
  status: CaseStatus;
  patient_ref: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  delivery_type: string;
  services?: { name: string } | null;
}

const DesignerHome = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
      setProfile(prof);

      const { data } = await supabase
        .from("cases")
        .select("id, service_code, status, patient_ref, created_at, updated_at, delivered_at, delivery_type, services(name)")
        .eq("assigned_designer_id", user.id)
        .order("created_at", { ascending: true });
      setCases((data || []) as unknown as CaseRow[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('designer-cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `assigned_designer_id=eq.${user.id}` }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const firstName = profile?.full_name?.split(" ")[0] || "Designer";
  const activeCases = cases.filter((c) => DESIGNER_ACTIVE_STATUSES.includes(c.status) && c.status !== "payment_verified" && c.status !== "final_delivery_submitted" && c.status !== "additional_data_review");
  const needsReviewCases = cases.filter((c) => c.status === "additional_data_review" as CaseStatus);
  const readyToDeliver = cases.filter((c) => c.status === "payment_verified" || c.status === "final_delivery_submitted");
  const completedCases = cases.filter((c) => c.status === "delivered").sort((a, b) =>
    new Date(b.delivered_at || b.updated_at).getTime() - new Date(a.delivered_at || a.updated_at).getTime()
  );
  const todayDelivered = completedCases.filter((c) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return new Date(c.delivered_at || c.updated_at) >= today;
  });

  const getDeadline = (c: CaseRow) => {
    const base = new Date(c.created_at).getTime();
    const hours = c.delivery_type === "rush" ? 24 : 48;
    return base + hours * 3600000 - Date.now();
  };

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "Overdue";
    const hours = Math.floor(ms / 3600000);
    if (hours < 1) return `${Math.floor(ms / 60000)}m left`;
    return `${hours}h left`;
  };

  const sortedActive = [...activeCases].sort((a, b) => getDeadline(a) - getDeadline(b));

  const renderCaseCard = (c: CaseRow) => {
    const remaining = getDeadline(c);
    const urgency = remaining < 4 * 3600000 ? "border-red-300 bg-red-50/50" :
                   remaining < 12 * 3600000 ? "border-amber-300 bg-amber-50/50" :
                   "border-border";
    const countdownColor = remaining < 4 * 3600000 ? "text-red-600" :
                          remaining < 12 * 3600000 ? "text-amber-600" : "text-muted-foreground";
    return (
      <div key={c.id} className={`bg-card rounded-xl border-2 ${urgency} p-5 transition-colors`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-mono text-muted-foreground">{formatCaseId(c.id)}</p>
            <p className="text-base font-sans font-medium text-foreground mt-0.5">{c.service_code} — {(c.services as any)?.name || "Service"}</p>
          </div>
          <DesignerStatusBadge status={c.status} />
        </div>
        <p className="text-sm font-sans text-muted-foreground mb-3">Patient: {c.patient_ref || "—"}</p>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-sans font-medium ${countdownColor}`}>
            <Clock size={12} className="inline mr-1" />
            {formatCountdown(remaining)}
          </span>
          <Link to={`/designer/cases/${c.id}`} className="flex items-center gap-1 text-sm font-sans text-primary hover:underline">
            Open Case <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  };

  if (loading) {
    return <DesignerLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></DesignerLayout>;
  }

  return (
    <DesignerLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">{getGreeting()}, {firstName}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="text-xs font-sans text-muted-foreground uppercase tracking-wide">Completed Today</span>
          </div>
          <p className="text-xl font-semibold font-sans">{todayDelivered.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-blue-500" />
            <span className="text-xs font-sans text-muted-foreground uppercase tracking-wide">Active Cases</span>
          </div>
          <p className="text-xl font-semibold font-sans">{activeCases.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <PackageCheck size={16} className="text-amber-500" />
            <span className="text-xs font-sans text-muted-foreground uppercase tracking-wide">Ready to Deliver</span>
          </div>
          <p className="text-xl font-semibold font-sans">{readyToDeliver.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-teal-500" />
            <span className="text-xs font-sans text-muted-foreground uppercase tracking-wide">Total Delivered</span>
          </div>
          <p className="text-xl font-semibold font-sans">{completedCases.length}</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active" className="font-sans">Active ({activeCases.length})</TabsTrigger>
          {needsReviewCases.length > 0 && (
            <TabsTrigger value="needs_review" className="font-sans relative">
              Needs Review ({needsReviewCases.length})
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            </TabsTrigger>
          )}
          <TabsTrigger value="ready_to_deliver" className="font-sans">Ready to Deliver ({readyToDeliver.length})</TabsTrigger>
          <TabsTrigger value="completed" className="font-sans">Completed ({completedCases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {sortedActive.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-10 text-center">
              <p className="text-muted-foreground font-sans text-sm">No active cases assigned. Check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedActive.map(renderCaseCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="needs_review">
          {needsReviewCases.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-10 text-center">
              <p className="text-muted-foreground font-sans text-sm">No files awaiting your review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {needsReviewCases.map((c) => (
                <div key={c.id} className="bg-card rounded-xl border-2 border-violet-300 bg-violet-50/30 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-mono text-muted-foreground">{formatCaseId(c.id)}</p>
                      <p className="text-base font-sans font-medium text-foreground mt-0.5">{c.service_code} — {(c.services as any)?.name || "Service"}</p>
                    </div>
                    <span className="text-[10px] font-sans font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-violet-100 text-violet-700">Files Uploaded</span>
                  </div>
                  <p className="text-sm font-sans text-muted-foreground mb-3">Patient: {c.patient_ref || "—"}</p>
                  <Link to={`/designer/cases/${c.id}`} className="flex items-center gap-1 text-sm font-sans text-primary hover:underline">
                    Review Files <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ready_to_deliver">
          {readyToDeliver.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-10 text-center">
              <p className="text-muted-foreground font-sans text-sm">No cases ready for delivery.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyToDeliver.map((c) => (
                <div key={c.id} className="bg-card rounded-xl border-2 border-amber-300 bg-amber-50/30 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-mono text-muted-foreground">{formatCaseId(c.id)}</p>
                      <p className="text-base font-sans font-medium text-foreground mt-0.5">{c.service_code} — {(c.services as any)?.name || "Service"}</p>
                    </div>
                    <DesignerStatusBadge status={c.status} />
                  </div>
                  <p className="text-sm font-sans text-muted-foreground mb-3">Patient: {c.patient_ref || "—"}</p>
                  <Link to={`/designer/cases/${c.id}`} className="flex items-center gap-1 text-sm font-sans text-primary hover:underline">
                    Deliver Now <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedCases.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-10 text-center">
              <p className="text-muted-foreground font-sans text-sm">No completed cases yet.</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                      <th className="px-5 py-3">Case ID</th>
                      <th className="px-5 py-3">Service</th>
                      <th className="px-5 py-3">Patient Ref</th>
                      <th className="px-5 py-3">Delivered</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedCases.map((c) => (
                      <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-5 py-3 text-sm font-mono">{formatCaseId(c.id)}</td>
                        <td className="px-5 py-3 text-sm font-sans">{c.service_code} — {(c.services as any)?.name || "—"}</td>
                        <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{c.patient_ref || "—"}</td>
                        <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{formatDate(c.delivered_at || c.updated_at)}</td>
                        <td className="px-5 py-3"><Link to={`/designer/cases/${c.id}`} className="text-sm text-primary hover:underline font-sans">View →</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DesignerLayout>
  );
};

export default DesignerHome;
