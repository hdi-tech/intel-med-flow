import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { FEEDBACK_STATUSES, FEEDBACK_TYPES, getFeedbackStatusMeta, getFeedbackTypeMeta } from "@/lib/feedbackHelpers";
import { formatCaseId } from "@/lib/caseHelpers";
import { Search, Star } from "lucide-react";

interface FeedbackRow {
  id: string;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  feedback_type: string;
  subject: string;
  rating: number | null;
  related_case_id: string | null;
  status: string;
  created_at: string;
}

const AdminFeedback = () => {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("feedback")
        .select("id, user_name, user_email, user_role, feedback_type, subject, rating, related_case_id, status, created_at")
        .order("created_at", { ascending: false });
      setRows((data || []) as FeedbackRow[]);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      new: rows.filter((r) => r.status === "new").length,
      reviewed: rows.filter((r) => r.status === "reviewed").length,
      resolved: rows.filter((r) => r.status === "resolved").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.feedback_type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (roleFilter !== "all" && r.user_role !== roleFilter) return false;
      if (ratingFilter !== "all" && String(r.rating ?? "") !== ratingFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${r.subject} ${r.user_name || ""} ${r.user_email || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, typeFilter, statusFilter, roleFilter, ratingFilter, search]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-serif text-foreground">User Feedback</h1>
        <p className="text-sm text-muted-foreground font-sans mt-1">Review and manage feedback submitted by clients and designers.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "New", value: stats.new, color: "text-red-600" },
          { label: "Reviewed", value: stats.reviewed, color: "text-yellow-600" },
          { label: "Resolved", value: stats.resolved, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-sans">{s.label}</p>
            <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject or name…"
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm font-sans"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-sans">
          <option value="all">All types</option>
          {FEEDBACK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-sans">
          <option value="all">All statuses</option>
          {FEEDBACK_STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-sans">
          <option value="all">All roles</option>
          <option value="client">Clients</option>
          <option value="designer">Designers</option>
        </select>
        <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-sans">
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => (<option key={n} value={String(n)}>{n}★</option>))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground font-sans">No feedback matches your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Case</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const t = getFeedbackTypeMeta(r.feedback_type);
                  const s = getFeedbackStatusMeta(r.status);
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 text-xs font-sans text-muted-foreground whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString()}<br/>
                        <span className="text-[10px]">{new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-sans">
                        <div className="font-medium">{r.user_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.user_email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-sans">
                        <span className="px-2 py-0.5 rounded bg-muted capitalize">{r.user_role || "—"}</span>
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded font-sans ${t.color}`}>{t.emoji} {t.label}</span></td>
                      <td className="px-4 py-3 text-sm font-sans max-w-[260px] truncate">{r.subject}</td>
                      <td className="px-4 py-3">
                        {r.rating ? (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={12} className="fill-amber-400" />)}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">
                        {r.related_case_id ? (
                          <Link to={`/admin/cases/${r.related_case_id}`} className="text-primary hover:underline">{formatCaseId(r.related_case_id)}</Link>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded font-sans ${s.color}`}>{s.label}</span></td>
                      <td className="px-4 py-3"><Link to={`/admin/feedback/${r.id}`} className="text-sm text-primary hover:underline font-sans">View →</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFeedback;