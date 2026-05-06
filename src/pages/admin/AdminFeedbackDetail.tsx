import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, Loader2, Mail, ExternalLink } from "lucide-react";
import { FEEDBACK_STATUSES, getFeedbackStatusMeta, getFeedbackTypeMeta } from "@/lib/feedbackHelpers";
import { formatCaseId } from "@/lib/caseHelpers";
import { getSignedFileUrl } from "@/lib/storageHelpers";

interface FeedbackDetail {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  feedback_type: string;
  subject: string;
  message: string;
  rating: number | null;
  related_case_id: string | null;
  screenshot_url: string | null;
  allow_use: boolean;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const AdminFeedbackDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<FeedbackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("new");
  const [adminNotes, setAdminNotes] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data: row, error } = await supabase.from("feedback").select("*").eq("id", id).maybeSingle();
      if (error || !row) {
        setLoading(false);
        return;
      }
      const r = row as unknown as FeedbackDetail;
      setData(r);
      setStatus(r.status);
      setAdminNotes(r.admin_notes || "");
      if (r.screenshot_url) {
        getSignedFileUrl(r.screenshot_url).then(setScreenshotUrl).catch(() => null);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase
      .from("feedback")
      .update({ status, admin_notes: adminNotes || null })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Changes saved" });
      setData((d) => (d ? { ...d, status, admin_notes: adminNotes || null } : d));
    }
  };

  if (loading) {
    return <AdminLayout><div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" /></div></AdminLayout>;
  }
  if (!data) {
    return (
      <AdminLayout>
        <Link to="/admin/feedback" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14}/> Back</Link>
        <div className="mt-6 text-center text-muted-foreground">Feedback not found.</div>
      </AdminLayout>
    );
  }

  const t = getFeedbackTypeMeta(data.feedback_type);
  const s = getFeedbackStatusMeta(data.status);
  const replyHref = data.user_email
    ? `mailto:${data.user_email}?subject=${encodeURIComponent(`Re: ${data.subject}`)}`
    : "#";

  return (
    <AdminLayout>
      <Link to="/admin/feedback" className="inline-flex items-center gap-1 text-sm font-sans text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={14}/> Back to feedback
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded font-sans ${t.color}`}>{t.emoji} {t.label}</span>
              <span className={`text-xs px-2 py-1 rounded font-sans ${s.color}`}>{s.label}</span>
              {data.rating && (
                <span className="flex items-center gap-0.5 text-amber-500 text-xs">
                  {Array.from({ length: data.rating }).map((_, i) => <Star key={i} size={12} className="fill-amber-400" />)}
                  <span className="ml-1 text-muted-foreground">{data.rating}/5</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-serif text-foreground mb-2">{data.subject}</h1>
            <p className="text-xs text-muted-foreground font-sans mb-4">
              Submitted {new Date(data.created_at).toLocaleString()}
            </p>
            <div className="bg-muted/40 rounded-lg p-4 whitespace-pre-wrap text-sm font-sans text-foreground">
              {data.message}
            </div>

            {screenshotUrl && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground font-sans mb-2">Screenshot</p>
                <a href={screenshotUrl} target="_blank" rel="noreferrer" className="block border border-border rounded-lg overflow-hidden max-w-md hover:opacity-90">
                  <img src={screenshotUrl} alt="Screenshot" className="w-full h-auto" />
                </a>
              </div>
            )}

            {data.related_case_id && (
              <div className="mt-4 text-sm font-sans">
                <span className="text-muted-foreground">Related case: </span>
                <Link to={`/admin/cases/${data.related_case_id}`} className="text-primary hover:underline inline-flex items-center gap-1">
                  {formatCaseId(data.related_case_id)} <ExternalLink size={12} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-sans font-semibold mb-3">User</h3>
            <p className="text-sm font-sans">{data.user_name || "—"}</p>
            <p className="text-xs text-muted-foreground font-sans">{data.user_email}</p>
            <p className="text-xs text-muted-foreground font-sans capitalize mt-1">Role: {data.user_role || "—"}</p>
            <p className="text-xs text-muted-foreground font-sans mt-1">Allow use: {data.allow_use ? "Yes" : "No"}</p>
            <a
              href={replyHref}
              className="mt-4 inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-lg font-sans hover:bg-primary/90"
            >
              <Mail size={14}/> Reply by Email
            </a>
          </div>

          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <div>
              <label className="block text-xs font-sans font-medium text-muted-foreground mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-sans"
              >
                {FEEDBACK_STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-sans font-medium text-muted-foreground mb-1.5">Admin notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={5}
                placeholder="Internal notes…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-sans"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-sm font-sans font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin"/>}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFeedbackDetail;