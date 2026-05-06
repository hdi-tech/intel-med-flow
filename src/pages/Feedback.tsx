import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import DesignerLayout from "@/components/DesignerLayout";
import { useToast } from "@/hooks/use-toast";
import { sendEmail, ADMIN_EMAIL } from "@/lib/emailHelpers";
import { FEEDBACK_TYPES, getFeedbackTypeMeta } from "@/lib/feedbackHelpers";
import { formatCaseId } from "@/lib/caseHelpers";
import { getSignedFileUrl } from "@/lib/storageHelpers";
import { Star, Upload, X, Loader2, CheckCircle2 } from "lucide-react";

interface UserCase {
  id: string;
  service_code: string | null;
  delivered_at?: string | null;
  assigned_designer_id?: string | null;
  services?: { name: string } | null;
}

const Feedback = () => {
  const { user, loading, isClient, isDesigner, primaryRole } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const caseParam = searchParams.get("case") || "";
  const [feedbackType, setFeedbackType] = useState<string>(searchParams.get("type") || (caseParam ? "service_quality" : ""));
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [relatedCaseId, setRelatedCaseId] = useState<string>(caseParam);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [allowUse, setAllowUse] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [cases, setCases] = useState<UserCase[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [caseLockedInfo, setCaseLockedInfo] = useState<{
    valid: boolean;
    case?: any;
    designerName?: string | null;
    alreadySubmitted?: { id: string; created_at: string } | null;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [{ data: profile }, { data: caseRows }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase
          .from("cases")
          .select("id, service_code, delivered_at, assigned_designer_id, services(name)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (profile?.full_name) setProfileName(profile.full_name);
      setCases((caseRows || []) as unknown as UserCase[]);

      // Validate case param if present
      if (caseParam) {
        const { data: c } = await supabase
          .from("cases")
          .select("id, user_id, service_code, delivered_at, assigned_designer_id, services(name)")
          .eq("id", caseParam)
          .maybeSingle();
        if (!c || (c as any).user_id !== user.id) {
          setCaseLockedInfo({ valid: false, error: "This feedback link is not valid for your account." });
          return;
        }
        // Check existing feedback for this case
        const { data: existing } = await supabase
          .from("feedback")
          .select("id, created_at")
          .eq("user_id", user.id)
          .eq("case_id", caseParam)
          .maybeSingle();
        let designerName: string | null = null;
        if ((c as any).assigned_designer_id) {
          const { data: dp } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", (c as any).assigned_designer_id)
            .maybeSingle();
          designerName = dp?.full_name || null;
        }
        setCaseLockedInfo({
          valid: true,
          case: c,
          designerName,
          alreadySubmitted: existing || null,
        });
      }
    };
    load();
  }, [user, caseParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F8FC]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  const Layout = isDesigner && !isClient ? DesignerLayout : DashboardLayout;

  const handleScreenshot = (file: File | null) => {
    if (!file) {
      setScreenshot(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5 MB.", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }
    setScreenshot(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!feedbackType) return toast({ title: "Select a feedback type", variant: "destructive" });
    if (subject.trim().length === 0) return toast({ title: "Subject is required", variant: "destructive" });
    if (message.trim().length < 50)
      return toast({ title: "Feedback too short", description: "Please write at least 50 characters.", variant: "destructive" });
    if (!allowUse) return toast({ title: "Please tick the permission checkbox", variant: "destructive" });

    setSubmitting(true);
    try {
      let screenshotPath: string | null = null;
      if (screenshot) {
        const safe = screenshot.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/feedback/${Date.now()}_${safe}`;
        const { error: upErr } = await supabase.storage.from("case-files").upload(path, screenshot);
        if (upErr) throw upErr;
        screenshotPath = path;
      }

      const userName = profileName || user.user_metadata?.full_name || user.email || "User";
      const userEmail = user.email || "";
      const userRole = isDesigner && !isClient ? "designer" : isClient ? "client" : primaryRole;
      const isCaseLink = !!caseParam && caseLockedInfo?.valid;
      const designerId = isCaseLink ? caseLockedInfo?.case?.assigned_designer_id || null : null;

      const { data: inserted, error: insErr } = await supabase
        .from("feedback")
        .insert({
          user_id: user.id,
          user_name: userName,
          user_email: userEmail,
          user_role: userRole,
          feedback_type: feedbackType,
          subject: subject.trim(),
          message: message.trim(),
          rating: rating > 0 ? rating : null,
          related_case_id: relatedCaseId || null,
          case_id: isCaseLink ? caseParam : (relatedCaseId || null),
          designer_id: designerId,
          feedback_source: isCaseLink ? "email_link" : "general",
          screenshot_url: screenshotPath,
          allow_use: allowUse,
        } as any)
        .select("id, created_at")
        .single();
      if (insErr) throw insErr;

      const typeLabel = getFeedbackTypeMeta(feedbackType).label;
      const relatedCase = cases.find((c) => c.id === relatedCaseId);
      const screenshotSignedUrl = screenshotPath ? await getSignedFileUrl(screenshotPath).catch(() => null) : null;

      // Notify admin
      sendEmail("feedback-admin", ADMIN_EMAIL, {
        feedback_id: inserted.id,
        user_name: userName,
        user_email: userEmail,
        user_role: userRole,
        feedback_type: rating > 0 && rating <= 2 ? `⚠️ LOW RATING — ${typeLabel}` : typeLabel,
        subject: subject.trim(),
        message: message.trim(),
        rating: rating > 0 ? rating : null,
        related_case_ref: relatedCase ? `${formatCaseId(relatedCase.id)} — ${relatedCase.services?.name || relatedCase.service_code || ""}` : null,
        designer_name: caseLockedInfo?.designerName || null,
        is_low_rating: rating > 0 && rating <= 2,
        screenshot_url: screenshotSignedUrl,
        created_at: new Date(inserted.created_at).toLocaleString(),
      });

      // Confirm to user
      sendEmail("feedback-user-confirm", userEmail, {
        user_name: userName,
        feedback_type: typeLabel,
        subject: subject.trim(),
        created_at: new Date(inserted.created_at).toLocaleString(),
      });

      // Reset form & show thank you
      setFeedbackType("");
      setSubject("");
      setMessage("");
      setRelatedCaseId("");
      setRating(0);
      setScreenshot(null);
      setAllowUse(false);
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-serif text-foreground mb-2">Share Your Feedback</h1>
          <p className="text-sm font-sans text-muted-foreground">
            Help us improve HDI Connect. Your feedback goes directly to our team.
          </p>
        </div>

        {/* Case link error */}
        {caseParam && caseLockedInfo && !caseLockedInfo.valid && (
          <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-xl p-5">
            <p className="text-sm font-sans font-semibold text-red-800">{caseLockedInfo.error}</p>
            <p className="text-xs font-sans text-red-700 mt-1">If you believe this is a mistake, please contact us at info@hdi-tech.com.</p>
          </div>
        )}

        {/* Case link — already submitted */}
        {caseParam && caseLockedInfo?.valid && caseLockedInfo.alreadySubmitted && !submitted && (
          <div className="mb-6 bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5">
            <p className="text-sm font-sans font-semibold text-emerald-800">
              ✅ You already submitted feedback for this case on{" "}
              {new Date(caseLockedInfo.alreadySubmitted.created_at).toLocaleDateString()}.
            </p>
            <div className="flex flex-wrap gap-3 mt-3">
              <Link to={`/dashboard/cases/${caseParam}`} className="text-sm font-sans bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
                Go to dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Case link — locked summary */}
        {caseParam && caseLockedInfo?.valid && !caseLockedInfo.alreadySubmitted && (
          <div className="mb-6 bg-primary/5 border-2 border-primary/30 rounded-xl p-5">
            <p className="text-xs font-sans font-semibold text-primary uppercase tracking-wide mb-2">Leaving feedback for</p>
            <p className="text-base font-sans font-semibold text-foreground">📋 {caseLockedInfo.case?.services?.name || caseLockedInfo.case?.service_code || "Case"}</p>
            <div className="text-xs font-sans text-muted-foreground mt-1 space-y-0.5">
              <p>Case ID: <span className="font-mono">{formatCaseId(caseParam)}</span></p>
              {caseLockedInfo.case?.delivered_at && (
                <p>Completed: {new Date(caseLockedInfo.case.delivered_at).toLocaleDateString()}</p>
              )}
              {caseLockedInfo.designerName && <p>Designer: {caseLockedInfo.designerName}</p>}
            </div>
          </div>
        )}

        {submitted && (
          <div className="mb-6 bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={22} />
            <div>
              <p className="text-base font-sans font-semibold text-emerald-800">
                Thank you, {profileName || user.email}! Your feedback has been received.
              </p>
              <p className="text-sm font-sans text-emerald-700 mt-1">
                Our team reviews all submissions and we may reach out to you at{" "}
                <span className="font-medium">{user.email}</span> if we need more details.
              </p>
              {caseParam && (
                <Link
                  to="/dashboard/cases"
                  className="inline-block mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-sans font-medium"
                >
                  Return to My Cases
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Hide form when case-link invalid OR already submitted */}
        {!(caseParam && caseLockedInfo && (!caseLockedInfo.valid || caseLockedInfo.alreadySubmitted)) && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-6">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-3">
              Feedback Type <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FEEDBACK_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.value}
                  onClick={() => setFeedbackType(t.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-sans transition-colors ${
                    feedbackType === t.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
              Subject <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value.slice(0, 100))}
              placeholder="Brief summary of your feedback"
              maxLength={100}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">{subject.length}/100</p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
              Your Feedback <span className="text-destructive">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              placeholder="Please describe your experience in detail..."
              rows={6}
              minLength={50}
              maxLength={2000}
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className={`text-xs mt-1 ${message.length < 50 ? "text-muted-foreground" : "text-emerald-600"}`}>
              {message.length}/2000 {message.length < 50 ? `(min 50)` : ""}
            </p>
          </div>

          {/* Related Case */}
          {cases.length > 0 && !caseParam && (
            <div>
              <label className="block text-sm font-sans font-medium text-foreground mb-1.5">Related Case (optional)</label>
              <select
                value={relatedCaseId}
                onChange={(e) => setRelatedCaseId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a case (optional)</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatCaseId(c.id)} — {c.services?.name || c.service_code || "Case"}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">Overall experience rating</label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hoverRating || rating) >= n;
                return (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setRating(n === rating ? 0 : n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                    aria-label={`Rate ${n} stars`}
                  >
                    <Star size={28} className={filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"} />
                  </button>
                );
              })}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground font-sans">{rating}/5</span>
              )}
            </div>
          </div>

          {/* Screenshot */}
          <div>
            <label className="block text-sm font-sans font-medium text-foreground mb-2">Attach a screenshot (optional)</label>
            {screenshot ? (
              <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
                <img
                  src={URL.createObjectURL(screenshot)}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded border border-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-sans truncate">{screenshot.name}</p>
                  <p className="text-xs text-muted-foreground">{(screenshot.size / 1024).toFixed(0)} KB</p>
                </div>
                <button type="button" onClick={() => setScreenshot(null)} className="text-muted-foreground hover:text-destructive p-1">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border bg-background hover:bg-muted/50 cursor-pointer text-sm font-sans text-muted-foreground transition-colors w-fit">
                <Upload size={16} />
                <span>Upload screenshot (max 5 MB)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => handleScreenshot(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>

          {/* Permission */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allowUse}
              onChange={(e) => setAllowUse(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm font-sans text-foreground">
              I allow HDI Connect to use this feedback to improve the platform.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-sans font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? "Sending..." : "Send Feedback"}
          </button>
        </form>
        )}
      </div>
    </Layout>
  );
};

export default Feedback;