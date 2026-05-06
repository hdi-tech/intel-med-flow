import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/dashboard/StatusBadge";
import CaseFileList, { type CaseFileItem } from "@/components/case/CaseFileList";
import CaseFileUpload from "@/components/case/CaseFileUpload";
import CaseMessageThread, { type CaseMessageItem } from "@/components/case/CaseMessageThread";
import AdditionalDataTimeline, { type AdditionalDataRequest } from "@/components/case/AdditionalDataTimeline";
import {
  formatCaseId, formatDate, formatDateTime, STATUS_ORDER, UNIFIED_TIMELINE_STAGES,
  type CaseStatus,
} from "@/lib/caseHelpers";
import { Download, Check, X, ArrowLeft, Loader2, PackageCheck, CreditCard, Building2, Upload } from "lucide-react";
import { downloadCaseFile } from "@/lib/storageHelpers";
import { useToast } from "@/hooks/use-toast";
import { sendEmail, ADMIN_EMAIL } from "@/lib/emailHelpers";
import BankTransferDetails from "@/components/BankTransferDetails";
import CaseFeedbackSection from "@/components/feedback/CaseFeedbackSection";

interface CaseDetail {
  id: string;
  service_code: string | null;
  status: CaseStatus;
  patient_ref: string | null;
  clinical_notes: string | null;
  delivery_type: string;
  consultation_requested: boolean | null;
  is_free_trial: boolean | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  quoted_price_usd: number | null;
  quote_sent_at: string | null;
  quote_accepted_at: string | null;
  payment_proof_url: string | null;
  payment_reference: string | null;
  payment_submitted_at: string | null;
  payment_verified_at: string | null;
  payment_rejection_note: string | null;
  assigned_designer_id: string | null;
  services?: { name: string; price_usd: number; is_custom_quote: boolean } | null;
}

interface CaseDesign {
  id: string;
  file_name: string;
  file_url: string;
  notes: string | null;
  version: number;
  created_at: string;
}

interface PaymentRecord {
  id: string;
  amount_usd: number;
  method: string | null;
  status: string;
  paid_at: string | null;
}

interface StatusHistoryRecord {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_by_role: string | null;
  notes: string | null;
  created_at: string;
}

const CaseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [files, setFiles] = useState<CaseFileItem[]>([]);
  const [designs, setDesigns] = useState<CaseDesign[]>([]);
  const [messages, setMessages] = useState<CaseMessageItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryRecord[]>([]);
  const [additionalDataRequests, setAdditionalDataRequests] = useState<AdditionalDataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [designerName, setDesignerName] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank" | null>(null);
  const [transferClaiming, setTransferClaiming] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);

  const loadCase = async () => {
    if (!id || !user) return;
    const { data: cd } = await supabase.from("cases").select("*, services(name, price_usd, is_custom_quote)").eq("id", id).single();
    setCaseData(cd as unknown as CaseDetail);

    const [{ data: f }, { data: d }, { data: m }, { data: p }, { data: h }, { data: adr }] = await Promise.all([
      supabase.from("case_files").select("*").eq("case_id", id).order("created_at"),
      supabase.from("case_designs").select("*").eq("case_id", id).order("version", { ascending: false }),
      supabase.from("case_messages").select("*").eq("case_id", id).order("created_at"),
      supabase.from("payments").select("*").eq("case_id", id),
      supabase.from("case_status_history").select("*").eq("case_id", id).order("created_at"),
      supabase.from("additional_data_requests").select("*").eq("case_id", id).order("created_at"),
    ]);
    setFiles((f || []) as CaseFileItem[]);
    setDesigns((d || []) as CaseDesign[]);
    setMessages((m || []) as CaseMessageItem[]);
    setPayments((p || []) as PaymentRecord[]);
    setStatusHistory((h || []) as StatusHistoryRecord[]);
    setAdditionalDataRequests((adr || []) as unknown as AdditionalDataRequest[]);

    // Fetch designer name + client name in parallel
    const designerId = (cd as any)?.assigned_designer_id || null;
    const [{ data: prof }, designerProf] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      designerId
        ? supabase.from("profiles").select("full_name").eq("id", designerId).maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);
    setClientName(prof?.full_name || user.user_metadata?.full_name || user.email || "");
    setDesignerName((designerProf as any)?.data?.full_name || null);

    setLoading(false);
  };

  useEffect(() => { loadCase(); }, [id, user]);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast({ title: "Payment successful!", description: "Your case is now being processed." });
    } else if (paymentStatus === "cancelled") {
      toast({ title: "Payment cancelled", description: "You can pay anytime from this page.", variant: "destructive" });
    }
  }, [searchParams]);

  // Realtime
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`client-case-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case_messages", filter: `case_id=eq.${id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as CaseMessageItem])
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case_files", filter: `case_id=eq.${id}` },
        (payload) => setFiles((prev) => [...prev, payload.new as CaseFileItem])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleApproveDesign = async () => {
    if (!id || !user) return;
    await supabase.from("cases").update({ status: "awaiting_payment" as any }).eq("id", id);
    await supabase.from("case_status_history").insert({
      case_id: id, old_status: caseData?.status, new_status: "awaiting_payment",
      changed_by: user.id, changed_by_role: "client",
    } as any);
    toast({ title: "Design approved", description: "Please complete payment to proceed." });
    loadCase();
  };

  const handleRequestRevision = async () => {
    if (!id || !user) return;
    await supabase.from("cases").update({ status: "revision_requested" as any }).eq("id", id);
    await supabase.from("case_status_history").insert({
      case_id: id, old_status: caseData?.status, new_status: "revision_requested",
      changed_by: user.id, changed_by_role: "client",
    } as any);
    toast({ title: "Revision requested", description: "The designer will be notified." });
    loadCase();
  };

  const handleAcceptQuote = async () => {
    if (!id || !user) return;
    await supabase.from("cases").update({ status: "quote_accepted" as any, quote_accepted_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("case_status_history").insert({
      case_id: id, old_status: "awaiting_quote", new_status: "quote_accepted",
      changed_by: user.id, changed_by_role: "client",
    } as any);
    toast({ title: "Quote accepted" });
    loadCase();
  };

  const handleDeclineQuote = async () => {
    if (!id || !user) return;
    await supabase.from("cases").update({ status: "under_review" as any }).eq("id", id);
    toast({ title: "Quote declined" });
    loadCase();
  };

  const handleInfoProvided = async () => {
    if (!id || !user) return;
    await supabase.from("cases").update({ status: "additional_data_review" as any }).eq("id", id);
    await supabase.from("case_status_history").insert({
      case_id: id, old_status: "awaiting_client_info", new_status: "additional_data_review",
      changed_by: user.id, changed_by_role: "client",
      notes: "Client provided requested information — awaiting designer review",
    } as any);
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "client" as any,
      message: "📋 I've provided the requested information. Please review.",
    });
    toast({ title: "Files submitted for review", description: "Your designer will review and respond." });
    loadCase();
  };

  const handleSubmitPaymentProof = async () => {
    if (!id || !user || !paymentProofFile) return;
    setSubmittingProof(true);
    try {
      // Upload proof file
      const safeName = paymentProofFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${id}/payment_proof_${Date.now()}_${safeName}`;
      const { error: uploadErr } = await supabase.storage.from("case-files").upload(path, paymentProofFile);
      if (uploadErr) throw uploadErr;

      // Update case with proof info and move to payment_under_verification
      await supabase.from("cases").update({
        status: "payment_under_verification" as any,
        payment_proof_url: path,
        payment_reference: paymentReference || null,
        payment_submitted_at: new Date().toISOString(),
        payment_rejection_note: null,
      } as any).eq("id", id);

      await supabase.from("case_status_history").insert({
        case_id: id, old_status: "awaiting_payment", new_status: "payment_under_verification",
        changed_by: user.id, changed_by_role: "client",
        notes: paymentReference ? `Reference: ${paymentReference}` : null,
      } as any);

      // Create pending payment record
      const svc = caseData?.services as any;
      const isCustomQuote = svc?.is_custom_quote || false;
      const amount = isCustomQuote ? (caseData?.quoted_price_usd || 0) : (svc?.price_usd || 0) * (caseData?.delivery_type === "rush" ? 1.2 : 1);
      await supabase.from("payments").insert({
        case_id: id, user_id: user.id, amount_usd: amount,
        method: "bank_transfer" as any, status: "pending" as any,
        transfer_claimed_at: new Date().toISOString(),
      } as any);

      await supabase.from("case_messages").insert({
        case_id: id, sender_id: user.id, sender_role: "client" as any,
        message: `💳 Payment proof submitted${paymentReference ? ` (Ref: ${paymentReference})` : ""}. Awaiting verification.`,
      });

      // Notify admin via email
      const svc2 = caseData?.services as any;
      const isCustomQuote2 = svc2?.is_custom_quote || false;
      const amt = isCustomQuote2 ? (caseData?.quoted_price_usd || 0) : (svc2?.price_usd || 0) * (caseData?.delivery_type === "rush" ? 1.2 : 1);
      sendEmail("payment-proof-admin", ADMIN_EMAIL, {
        clientName: user.user_metadata?.full_name || user.email,
        caseRef: formatCaseId(id!),
        caseId: id,
        amount: amt.toFixed(2),
        reference: paymentReference || null,
      });

      toast({ title: "Payment proof submitted", description: "Our team will verify your payment shortly." });
      setPaymentProofFile(null);
      setPaymentReference("");
      loadCase();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingProof(false);
    }
  };

  const handlePayNow = async () => {
    if (!id) return;
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { case_id: id },
      });
      if (error) throw error;
      if (data?.free_trial) {
        toast({ title: "Free trial applied!", description: "Your case is now being processed." });
        loadCase();
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: "Payment error", description: err.message, variant: "destructive" });
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return <DashboardLayout><div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;
  }

  if (!caseData) {
    return <DashboardLayout><div className="text-center py-20"><p className="text-muted-foreground font-sans">Case not found.</p><Link to="/dashboard/cases" className="text-primary text-sm font-sans mt-2 inline-block">← Back to cases</Link></div></DashboardLayout>;
  }

  const svc = caseData.services as any;
  const currentStageIdx = STATUS_ORDER.indexOf(caseData.status);
  const isCustomQuote = svc?.is_custom_quote || false;
  const price = isCustomQuote ? (caseData.quoted_price_usd || 0) : (svc?.price_usd || 0) * (caseData.delivery_type === "rush" ? 1.2 : 1);
  const isDelivered = caseData.status === "delivered";
  const paidPayment = payments.find((p) => p.status === "paid");

  return (
    <DashboardLayout>
      <Link to="/dashboard/cases" className="inline-flex items-center gap-1 text-sm font-sans text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft size={14} /> Back to cases
      </Link>

      {/* Delivered Banner */}
      {isDelivered && (
        <div className="mb-4 bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <PackageCheck size={24} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-base font-sans font-semibold text-emerald-800">Your files are ready to download</p>
              <p className="text-sm font-sans text-emerald-700 mt-1">Your design files have been delivered. Download them from the Files section below.</p>
              <Link
                to={`/feedback?type=service_quality&case=${id}`}
                className="inline-flex items-center gap-1.5 mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-sans font-medium"
              >
                💬 Leave Feedback on this case
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Payment rejection banner */}
      {caseData.status === "awaiting_payment" && caseData.payment_rejection_note && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-sans font-medium text-red-800">⚠️ Payment could not be verified</p>
          <p className="text-xs font-sans text-red-700 mt-1">{caseData.payment_rejection_note}</p>
          <p className="text-xs font-sans text-red-600 mt-2">Please resubmit your payment proof below.</p>
        </div>
      )}

      {/* Payment under verification banner */}
      {caseData.status === "payment_under_verification" && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-sans font-medium text-yellow-800">⏳ Payment Under Verification</p>
          <p className="text-xs font-sans text-yellow-700 mt-1">We have received your payment proof and are verifying it. This usually takes 24 hours.</p>
        </div>
      )}

      {/* Payment verified banner */}
      {caseData.status === "payment_verified" && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-sans font-medium text-green-800">✓ Payment Verified — Your final files are being prepared.</p>
        </div>
      )}

      {/* Awaiting client info banner */}
      {caseData.status === "awaiting_client_info" && (
        <div className="mb-4 bg-orange-50 border-2 border-orange-300 rounded-xl p-5">
          <p className="text-base font-sans font-semibold text-orange-800">Additional information requested</p>
          <p className="text-sm font-sans text-orange-700 mt-1">Your designer has requested additional files or information. Please upload the requested files and/or reply in the message thread below, then click the button to notify your designer.</p>
          <button onClick={handleInfoProvided} className="mt-3 flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-sans font-medium hover:bg-primary/90">
            <Check size={14} /> I've Provided the Requested Information
          </button>
        </div>
      )}

      {/* Additional data under review banner */}
      {caseData.status === "additional_data_review" && (
        <div className="mb-4 bg-violet-50 border-2 border-violet-300 rounded-xl p-5">
          <p className="text-base font-sans font-semibold text-violet-800">Files submitted — awaiting designer review</p>
          <p className="text-sm font-sans text-violet-700 mt-1">Your files have been submitted and are being reviewed by your designer. You'll be notified once they respond.</p>
        </div>
      )}

      {/* Banners */}
      {caseData.status === "awaiting_quote" && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-sans font-medium text-amber-800">⏳ Awaiting Custom Quote</p>
          <p className="text-xs font-sans text-amber-700 mt-1">Our team is reviewing your case files. You will receive a price quote within 24 hours.</p>
        </div>
      )}
      {caseData.status === "quote_accepted" && (
        <div className="mb-4 bg-teal-50 border border-teal-200 rounded-lg p-4">
          <p className="text-sm font-sans font-medium text-teal-800">✓ Quote Accepted — Your case is now in the design queue.</p>
        </div>
      )}

      {/* Pending client approval banner */}
      {caseData.status === "pending_client_approval" && (
        <div className="mb-4 bg-cyan-50 border-2 border-cyan-300 rounded-xl p-5">
          <p className="text-base font-sans font-semibold text-cyan-800">Your design is ready for approval</p>
          <p className="text-sm font-sans text-cyan-700 mt-1">Review the design files below and approve to proceed to payment, or request a revision.</p>
          <div className="flex gap-3 mt-4">
            <button onClick={handleApproveDesign} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-sans font-medium hover:bg-primary/90"><Check size={14} /> Approve Design</button>
            <button onClick={handleRequestRevision} className="flex items-center gap-1.5 border border-border text-muted-foreground px-4 py-2 rounded-lg text-sm font-sans hover:bg-muted"><X size={14} /> Request Revision</button>
          </div>
        </div>
      )}

      {/* Quote card */}
      {isCustomQuote && caseData.quoted_price_usd && caseData.status === "awaiting_quote" && (
        <div className="mb-4 bg-card border-2 border-primary/30 rounded-xl p-5">
          <p className="text-xs font-sans font-semibold text-primary uppercase tracking-wide mb-3">Custom Quote Received</p>
          <div className="space-y-1 text-sm font-sans">
            <p><span className="text-muted-foreground">Service:</span> {svc?.name}</p>
            <p><span className="text-muted-foreground">Quoted Price:</span> <span className="font-semibold text-foreground">${caseData.quoted_price_usd} USD</span></p>
            {caseData.quote_sent_at && <p><span className="text-muted-foreground">Sent:</span> {formatDate(caseData.quote_sent_at)}</p>}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleAcceptQuote} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-sans font-medium hover:bg-primary/90"><Check size={14} /> Accept Quote</button>
            <button onClick={handleDeclineQuote} className="flex items-center gap-1.5 border border-border text-muted-foreground px-4 py-2 rounded-lg text-sm font-sans hover:bg-muted"><X size={14} /> Decline</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-sm font-mono text-muted-foreground">{formatCaseId(caseData.id)}</span>
              <StatusBadge status={caseData.status} size="lg" />
            </div>
            <h1 className="text-xl font-serif text-foreground mb-1">{caseData.service_code} — {svc?.name || "Service"}</h1>
            <p className="text-sm font-sans text-muted-foreground">Patient: {caseData.patient_ref || "—"} · Submitted {formatDate(caseData.created_at)}</p>
          </div>

          {/* Timeline */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Status Timeline</h3>
            <div className="space-y-0">
              {UNIFIED_TIMELINE_STAGES.filter((stage) => {
                if (!stage.conditional) return true;
                return statusHistory.some((h) => h.new_status === stage.status) || caseData.status === stage.status;
              }).map((stage, i, arr) => {
                const stageIdx = STATUS_ORDER.indexOf(stage.status);
                const isCompleted = stageIdx < currentStageIdx;
                const isCurrent = stage.status === caseData.status;
                const historyEntry = statusHistory.find((h) => h.new_status === stage.status);
                return (
                  <div key={stage.status} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse" : "bg-gray-100 border border-gray-200"}`}>
                        {isCompleted && <Check size={12} />}
                        {isCurrent && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      {i < arr.length - 1 && <div className={`w-0.5 h-6 ${isCompleted ? "bg-primary" : "bg-gray-200"}`} />}
                    </div>
                    <div className="pb-4">
                      <p className={`text-sm font-sans ${isCurrent ? "font-semibold text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>{stage.label}</p>
                      {(isCompleted || isCurrent) && historyEntry && (
                        <p className="text-[10px] font-sans text-muted-foreground">{formatDateTime(historyEntry.created_at)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Proof Upload — shown when awaiting_payment */}
          {caseData.status === "awaiting_payment" && (
            <div className="bg-card rounded-xl border-2 border-orange-200 p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Complete Payment</h3>
              <BankTransferDetails caseId={id} />

              <div className="mt-5 pt-4 border-t border-border space-y-4">
                <div>
                  <label className="text-xs font-sans text-muted-foreground mb-1 block">Upload Payment Proof (image or PDF) *</label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 cursor-pointer transition-colors"
                    onClick={() => document.getElementById("payment-proof-upload")?.click()}
                  >
                    {paymentProofFile ? (
                      <p className="text-sm font-sans text-foreground">📄 {paymentProofFile.name}</p>
                    ) : (
                      <>
                        <Upload size={20} className="mx-auto text-muted-foreground mb-1" />
                        <p className="text-xs font-sans text-muted-foreground">Click to upload proof</p>
                      </>
                    )}
                    <input id="payment-proof-upload" type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-sans text-muted-foreground mb-1 block">Payment Reference (optional)</label>
                  <input type="text" className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background"
                    value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="e.g. transaction ID" />
                </div>
                <button onClick={handleSubmitPaymentProof} disabled={!paymentProofFile || submittingProof}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-primary/90 disabled:opacity-50">
                  {submittingProof ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : "Submit Payment Proof"}
                </button>
              </div>
            </div>
          )}

          {/* Additional Data Request History */}
          <AdditionalDataTimeline requests={additionalDataRequests} files={files} viewerRole="client" />

          {/* All Files */}
          <CaseFileList files={files} title="Case Files" />

          {/* Add More Files — hide after delivered */}
          {user && id && !isDelivered && <CaseFileUpload caseId={id} userId={user.id} uploaderRole="client" onUploaded={loadCase} />}

          {/* Design Files */}
          {designs.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Design Files</h3>
              <div className="space-y-2">
                {designs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5">
                    <div>
                      <p className="text-sm font-sans text-foreground">{d.file_name}</p>
                      {d.notes && <p className="text-xs font-sans text-muted-foreground">{d.notes}</p>}
                    </div>
                    <button onClick={() => downloadCaseFile(d.file_url, d.file_name)} className="text-primary p-1 hover:text-primary/80"><Download size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Receipt (when delivered or paid) */}
          {paidPayment && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Payment Receipt</h3>
              <div className="space-y-2 text-sm font-sans">
                <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="font-medium">${paidPayment.amount_usd}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="font-medium">{paidPayment.method === "card" ? "Card" : paidPayment.method === "bank_transfer" ? "Bank Transfer" : paidPayment.method || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{paidPayment.paid_at ? formatDate(paidPayment.paid_at) : "—"}</span></div>
              </div>
            </div>
          )}

          {/* In-case feedback (delivered) */}
          {isDelivered && user && id && (
            <CaseFeedbackSection
              caseId={id}
              userId={user.id}
              userName={clientName || user.email || "Client"}
              userEmail={user.email || ""}
              serviceName={svc?.name || caseData.service_code || "Case"}
              designerId={(caseData as any).assigned_designer_id || null}
              designerName={designerName}
            />
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {user && id && (
            <CaseMessageThread caseId={id} userId={user.id} senderRole="client" messages={messages} title="Messages — Specialist & HDI Team" caseData={{ assigned_designer_id: (caseData as any).assigned_designer_id || null, user_id: user.id, service_code: caseData.service_code }} />
          )}

          {/* Case Info */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Case Info</h3>
            <div className="space-y-2 text-sm font-sans">
              <InfoRow label="Service" value={svc?.name || "—"} />
              <InfoRow label="Code" value={caseData.service_code || "—"} />
              <InfoRow label="Price" value={isCustomQuote ? (caseData.quoted_price_usd ? `$${caseData.quoted_price_usd}` : "Custom Quote") : `$${price.toFixed(2)}`} />
              <InfoRow label="Delivery" value={caseData.delivery_type === "rush" ? "Rush (24h)" : "Standard (48h)"} />
              <InfoRow label="Consultation" value={caseData.consultation_requested ? "Yes" : "No"} />
              <InfoRow label="Free Trial" value={caseData.is_free_trial ? "Yes" : "No"} />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

export default CaseDetailPage;
