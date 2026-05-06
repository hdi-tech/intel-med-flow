import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { sendEmail, ADMIN_EMAIL } from "@/lib/emailHelpers";
import { formatCaseId, formatDate } from "@/lib/caseHelpers";
import { Star, Loader2, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react";

interface Props {
  caseId: string;
  userId: string;
  userName: string;
  userEmail: string;
  serviceName: string;
  designerId: string | null;
  designerName: string | null;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

const CaseFeedbackSection = ({
  caseId,
  userId,
  userName,
  userEmail,
  serviceName,
  designerId,
  designerName,
}: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<any | null>(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [recommends, setRecommends] = useState<"yes" | "not_sure" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("feedback")
        .select("id, rating, message, created_at, recommends")
        .eq("user_id", userId)
        .eq("case_id", caseId)
        .maybeSingle();
      setExisting(data);
      setLoading(false);
    };
    load();
  }, [caseId, userId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const subject = `Case ${formatCaseId(caseId)} — ${serviceName} feedback`;
      const body = message.trim() || `Rating: ${rating}/5 (${RATING_LABELS[rating]})`;
      const { data: inserted, error } = await supabase
        .from("feedback")
        .insert({
          user_id: userId,
          user_name: userName,
          user_email: userEmail,
          user_role: "client",
          feedback_type: "service_quality",
          subject,
          message: body,
          rating,
          related_case_id: caseId,
          case_id: caseId,
          designer_id: designerId,
          feedback_source: "case",
          recommends: recommends || null,
          allow_use: true,
        } as any)
        .select("id, rating, message, created_at, recommends")
        .single();
      if (error) throw error;

      // Notify admin
      sendEmail("feedback-admin", ADMIN_EMAIL, {
        feedback_id: inserted.id,
        user_name: userName,
        user_email: userEmail,
        user_role: "client",
        feedback_type: rating <= 2 ? `⚠️ LOW RATING — Service Quality` : "Service Quality",
        subject,
        message: body,
        rating,
        related_case_ref: `${formatCaseId(caseId)} — ${serviceName}`,
        designer_name: designerName || "—",
        created_at: new Date(inserted.created_at).toLocaleString(),
        is_low_rating: rating <= 2,
      });

      // Confirm to user
      sendEmail("feedback-user-confirm", userEmail, {
        user_name: userName,
        feedback_type: "Service Quality",
        subject,
        created_at: new Date(inserted.created_at).toLocaleString(),
      });

      setExisting(inserted);
      setJustSubmitted(true);
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" size={18} />
      </div>
    );
  }

  if (existing) {
    return (
      <div
        className={`bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5 transition-all duration-500 ${
          justSubmitted ? "animate-in fade-in slide-in-from-bottom-2" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={22} />
          <div className="flex-1">
            <p className="text-base font-sans font-semibold text-emerald-800">
              {justSubmitted
                ? `Thank you for your feedback, ${userName}!`
                : "You already left feedback for this case"}
            </p>
            {existing.rating && (
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < existing.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-emerald-200"
                    }
                  />
                ))}
                <span className="ml-2 text-sm font-sans text-emerald-700">
                  {existing.rating}/5
                </span>
              </div>
            )}
            <p className="text-xs font-sans text-emerald-700 mt-2">
              Submitted {formatDate(existing.created_at)}
            </p>
            {!justSubmitted && (
              <Link
                to="/feedback"
                className="inline-flex items-center gap-1 mt-3 text-sm font-sans font-medium text-emerald-700 hover:text-emerald-900 underline"
              >
                View your feedback
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border-2 border-primary/20 p-5">
      <h3 className="text-base font-sans font-semibold text-foreground mb-1">
        💬 How was your experience?
      </h3>
      <p className="text-sm font-sans text-muted-foreground mb-5">
        We'd love to hear your thoughts on this case. Your feedback helps us improve.
      </p>

      {/* Rating */}
      <div className="mb-5">
        <label className="block text-sm font-sans font-medium text-foreground mb-2">
          Rate your experience <span className="text-destructive">*</span>
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = (hover || rating) >= n;
            return (
              <button
                type="button"
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="p-1 transition-transform hover:scale-110"
                aria-label={`Rate ${n} stars`}
              >
                <Star
                  size={36}
                  className={
                    filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                  }
                />
              </button>
            );
          })}
          {(hover || rating) > 0 && (
            <span className="ml-3 text-sm font-sans font-medium text-foreground">
              {RATING_LABELS[hover || rating]}
            </span>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="mb-5">
        <label className="block text-sm font-sans font-medium text-foreground mb-1.5">
          What went well? Any suggestions? <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="Share your experience with this case..."
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground mt-1">{message.length}/1000</p>
      </div>

      {/* Recommends */}
      <div className="mb-5">
        <label className="block text-sm font-sans font-medium text-foreground mb-2">
          Would you recommend HDI Connect? <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRecommends(recommends === "yes" ? "" : "yes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-sans transition-colors ${
              recommends === "yes"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
                : "border-border bg-background text-foreground hover:border-emerald-300"
            }`}
          >
            <ThumbsUp size={14} /> Yes, I would
          </button>
          <button
            type="button"
            onClick={() => setRecommends(recommends === "not_sure" ? "" : "not_sure")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-sans transition-colors ${
              recommends === "not_sure"
                ? "border-amber-500 bg-amber-50 text-amber-700 font-medium"
                : "border-border bg-background text-foreground hover:border-amber-300"
            }`}
          >
            <ThumbsDown size={14} /> Not sure
          </button>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-sans font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {submitting ? "Sending..." : "Submit Feedback"}
      </button>
    </div>
  );
};

export default CaseFeedbackSection;