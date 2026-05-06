import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import StatusBadge from "@/components/dashboard/StatusBadge";
import CaseFileList, { type CaseFileItem } from "@/components/case/CaseFileList";
import CaseFileUpload from "@/components/case/CaseFileUpload";
import CaseMessageThread, { type CaseMessageItem } from "@/components/case/CaseMessageThread";
import AdditionalDataTimeline, { type AdditionalDataRequest } from "@/components/case/AdditionalDataTimeline";
import { formatCaseId, formatDate, formatDateTime, STATUS_ORDER, TIMELINE_STAGES, type CaseStatus } from "@/lib/caseHelpers";
import { downloadCaseFile, getSignedFileUrl } from "@/lib/storageHelpers";
import { ArrowLeft, Check, Download, Save, Archive, X, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendEmail } from "@/lib/emailHelpers";

interface CaseData {
  id: string;
  service_code: string | null;
  status: CaseStatus;
  patient_ref: string | null;
  clinical_notes: string | null;
  delivery_type: string;
  consultation_requested: boolean | null;
  is_free_trial: boolean | null;
  is_archived: boolean | null;
  created_at: string;
  updated_at: string;
  assigned_designer_id: string | null;
  admin_notes: string | null;
  user_id: string;
  quoted_price_usd: number | null;
  quote_sent_at: string | null;
  quote_accepted_at: string | null;
  payment_proof_url: string | null;
  payment_reference: string | null;
  payment_submitted_at: string | null;
  payment_verified_at: string | null;
  payment_verified_by: string | null;
  payment_rejection_note: string | null;
  services?: { name: string; price_usd: number; is_custom_quote: boolean } | null;
}

interface Designer { id: string; full_name: string | null; }
interface CaseDesign { id: string; file_name: string; file_url: string; notes: string | null; version: number; }
interface Payment { id: string; amount_usd: number; status: string; method: string | null; paid_at: string | null; }
interface StatusHistoryRecord {
  id: string; old_status: string | null; new_status: string;
  changed_by: string | null; changed_by_role: string | null; notes: string | null; created_at: string;
}

interface CaseFeedbackRow {
  id: string;
  rating: number | null;
  message: string;
  recommends: string | null;
  feedback_source: string | null;
  created_at: string;
  user_name: string | null;
}

const AdminCaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [files, setFiles] = useState<CaseFileItem[]>([]);
  const [designs, setDesigns] = useState<CaseDesign[]>([]);
  const [messages, setMessages] = useState<CaseMessageItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryRecord[]>([]);
  const [additionalDataRequests, setAdditionalDataRequests] = useState<AdditionalDataRequest[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);

  const [assignedDesigner, setAssignedDesigner] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<CaseStatus>("draft");
  const [adminNotes, setAdminNotes] = useState("");
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [proofSignedUrl, setProofSignedUrl] = useState<string | null>(null);
  const [caseFeedback, setCaseFeedback] = useState<CaseFeedbackRow | null>(null);

  const loadCase = async () => {
    if (!id) return;
    const { data: cd } = await supabase.from("cases").select("*, services(name, price_usd, is_custom_quote)").eq("id", id).single();
    const c = cd as unknown as CaseData;
    setCaseData(c);
    setAssignedDesigner(c?.assigned_designer_id || "");
    setSelectedStatus(c?.status || "draft");
    setAdminNotes(c?.admin_notes || "");

    const [{ data: f }, { data: d }, { data: m }, { data: p }, { data: h }, { data: adr }] = await Promise.all([
      supabase.from("case_files").select("*").eq("case_id", id).order("created_at"),
      supabase.from("case_designs").select("id, file_name, file_url, notes, version").eq("case_id", id).order("version", { ascending: false }),
      supabase.from("case_messages").select("*").eq("case_id", id).order("created_at"),
      supabase.from("payments").select("*").eq("case_id", id),
      supabase.from("case_status_history").select("*").eq("case_id", id).order("created_at"),
      supabase.from("additional_data_requests").select("*").eq("case_id", id).order("created_at"),
    ]);
    setFiles((f || []) as CaseFileItem[]);
    setDesigns((d || []) as CaseDesign[]);
    setMessages((m || []) as CaseMessageItem[]);
    setPayments((p || []) as Payment[]);
    setStatusHistory((h || []) as StatusHistoryRecord[]);
    setAdditionalDataRequests((adr || []) as unknown as AdditionalDataRequest[]);

    // Fetch feedback for this case
    const { data: fb } = await supabase
      .from("feedback")
      .select("id, rating, message, recommends, feedback_source, created_at, user_name")
      .eq("case_id", id)
      .maybeSingle();
    setCaseFeedback((fb as unknown as CaseFeedbackRow) || null);

    const { data: designerRoles } = await supabase.from("user_roles").select("user_id").eq("role", "designer");
    if (designerRoles && designerRoles.length > 0) {
      const ids = designerRoles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setDesigners((profiles || []) as Designer[]);
    }
    setLoading(false);
  };

  useEffect(() => { loadCase(); }, [id]);

  // Generate signed URL for payment proof
  useEffect(() => {
    if (caseData?.payment_proof_url) {
      getSignedFileUrl(caseData.payment_proof_url).then(setProofSignedUrl);
    } else {
      setProofSignedUrl(null);
    }
  }, [caseData?.payment_proof_url]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`admin-case-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case_messages", filter: `case_id=eq.${id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as CaseMessageItem])
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case_files", filter: `case_id=eq.${id}` },
        (payload) => setFiles((prev) => [...prev, payload.new as CaseFileItem])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleSaveChanges = async () => {
    if (!id || !user) return;
    const oldStatus = caseData?.status;
    
    // Auto-set status to in_design when assigning a designer from payment_verified
    let newStatus = selectedStatus;
    if (assignedDesigner && !caseData?.assigned_designer_id && 
        (oldStatus === "payment_verified" || oldStatus === "submitted" || oldStatus === "under_review") &&
        selectedStatus === oldStatus) {
      newStatus = "in_design" as CaseStatus;
      setSelectedStatus(newStatus);
    }
    
    await supabase.from("cases").update({
      assigned_designer_id: assignedDesigner || null,
      status: newStatus as any,
      admin_notes: adminNotes,
    }).eq("id", id);
    if (oldStatus !== newStatus) {
      await supabase.from("case_status_history").insert({
        case_id: id, old_status: oldStatus, new_status: newStatus,
        changed_by: user.id, changed_by_role: "admin",
        notes: assignedDesigner ? "Designer assigned — case moved to design" : undefined,
      } as any);
      // Notify via message thread when designer is assigned
      if (assignedDesigner && newStatus === "in_design") {
        await supabase.from("case_messages").insert({
          case_id: id, sender_id: user.id, sender_role: "admin" as any,
          message: "👨‍🎨 A designer has been assigned to your case. Design work is now in progress.",
        });

        // Email notification to the designer
        const designerProfile = designers.find(d => d.id === assignedDesigner);
        const { data: authDesigner } = await supabase.rpc("has_role", { _user_id: assignedDesigner, _role: "designer" });
        // Fetch designer email from profiles + auth
        const { data: designerEmailData } = await supabase.from("profiles").select("full_name").eq("id", assignedDesigner).single();
        // We can't get email from auth client-side, so use the edge function approach
        // Instead, use the designer profile name and fetch email via message context
        const svcInfo = caseData?.services as any;
        sendEmail("case-assigned", assignedDesigner, {
          designerName: designerProfile?.full_name || "Designer",
          caseRef: formatCaseId(id!),
          caseId: id,
          serviceCode: caseData?.service_code || "",
          serviceName: svcInfo?.name || "",
          deliveryType: caseData?.delivery_type || "standard",
          patientRef: caseData?.patient_ref || "",
          clinicalNotes: caseData?.clinical_notes || "",
        });
      }
    }
    toast({ title: "Changes saved" });
    loadCase();
  };

  const handleArchive = async () => {
    if (!id) return;
    await supabase.from("cases").update({ is_archived: true } as any).eq("id", id);
    toast({ title: "Case archived" });
    loadCase();
  };

  const handleSendQuote = async () => {
    if (!id || !quotePrice || !user) return;
    const price = parseFloat(quotePrice);
    if (isNaN(price) || price <= 0) return;
    await supabase.from("cases").update({
      quoted_price_usd: price,
      quote_sent_at: new Date().toISOString(),
      status: "awaiting_quote" as any,
    }).eq("id", id);
    await supabase.from("case_status_history").insert({
      case_id: id, old_status: caseData?.status, new_status: "awaiting_quote",
      changed_by: user.id, changed_by_role: "admin",
      notes: `Custom quote of $${price.toFixed(2)} sent to client`,
    } as any);
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "admin",
      message: `💰 Custom Quote: $${price.toFixed(2)} USD${quoteNotes ? `\n\nNote: ${quoteNotes}` : ""}`,
    });
    toast({ title: "Quote sent to client" });
    setQuotePrice(""); setQuoteNotes("");
    loadCase();
  };

  const handleReleaseToClient = async () => {
    if (!id || !user) return;
    const now = new Date().toISOString();
    await supabase.from("cases").update({ status: "delivered" as any, delivered_at: now }).eq("id", id);
    await supabase.from("case_status_history").insert({
      case_id: id, old_status: "design_review", new_status: "delivered",
      changed_by: user.id, changed_by_role: "admin",
      notes: "Design QC passed — delivered to client",
    } as any);
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "admin" as any,
      message: "✅ Your design has been reviewed and delivered. You can now download the final files from the Files section.",
    });

    // Lookup designer name
    let designerName = "";
    if (caseData?.assigned_designer_id) {
      const dp = designers.find(d => d.id === caseData.assigned_designer_id);
      designerName = dp?.full_name || "";
    }
    const svcInfo = caseData?.services as any;
    // Email client about delivery (with feedback button)
    sendEmail("design-delivered", caseData?.user_id || "", {
      clientName: "",
      caseRef: formatCaseId(id!),
      caseId: id,
      serviceName: svcInfo?.name || caseData?.service_code || "",
      designerName,
      completedAt: new Date(now).toLocaleDateString(),
    });

    toast({ title: "Case delivered", description: "Client has been notified that files are ready." });
    loadCase();
  };

  const handleVerifyPayment = async () => {
    if (!id || !user) return;
    await supabase.from("cases").update({
      status: "payment_verified" as any,
      payment_verified_at: new Date().toISOString(),
      payment_verified_by: user.id,
    } as any).eq("id", id);
    await supabase.from("case_status_history").insert({
      case_id: id, old_status: "payment_under_verification", new_status: "payment_verified",
      changed_by: user.id, changed_by_role: "admin",
    } as any);
    // Mark the pending payment as paid
    const pendingPayment = payments.find((p) => p.status === "pending");
    if (pendingPayment) {
      await supabase.from("payments").update({ status: "paid" as any, paid_at: new Date().toISOString() }).eq("id", pendingPayment.id);
    }
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "admin" as any,
      message: "✅ Payment has been verified and confirmed. Your case is now in the assignment queue.",
    });

    // Email client about payment approval
    sendEmail("payment-approved", caseData?.user_id || "", {
      clientName: "",
      caseRef: formatCaseId(id!),
      caseId: id,
    });

    toast({ title: "Payment verified", description: "Case is now in the assignment queue." });
    loadCase();
  };

  const handleRejectPayment = async () => {
    if (!id || !user || !rejectionNote.trim()) return;
    await supabase.from("cases").update({
      status: "awaiting_payment" as any,
      payment_rejection_note: rejectionNote,
      payment_proof_url: null,
      payment_reference: null,
      payment_submitted_at: null,
    } as any).eq("id", id);
    await supabase.from("case_status_history").insert({
      case_id: id, old_status: "payment_under_verification", new_status: "awaiting_payment",
      changed_by: user.id, changed_by_role: "admin",
      notes: `Payment rejected: ${rejectionNote}`,
    } as any);
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "admin" as any,
      message: `❌ Payment could not be verified: ${rejectionNote}\n\nPlease resubmit your payment proof.`,
    });
    toast({ title: "Payment rejected", description: "Client has been notified to resubmit." });
    setRejectionNote("");
    setShowRejectionForm(false);
    loadCase();
  };

  if (loading) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;
  }

  if (!caseData) {
    return <AdminLayout><div className="text-center py-20 text-muted-foreground font-sans">Case not found.</div></AdminLayout>;
  }

  const svc = caseData.services as any;
  const isCustomQuote = svc?.is_custom_quote || false;

  return (
    <AdminLayout>
      <Link to="/admin/cases" className="inline-flex items-center gap-1 text-sm font-sans text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={14} /> Back to cases
      </Link>

      {isCustomQuote && caseData.quote_accepted_at && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm font-sans font-medium text-emerald-800">✓ Client accepted quote of ${caseData.quoted_price_usd} on {formatDate(caseData.quote_accepted_at)}</p>
        </div>
      )}

      {caseData.is_archived && (
        <div className="mb-4 bg-gray-100 border border-gray-300 rounded-lg p-4">
          <p className="text-sm font-sans font-medium text-gray-600">📦 This case is archived</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-sm font-mono text-muted-foreground">{formatCaseId(caseData.id)}</span>
              <StatusBadge status={caseData.status} size="lg" />
            </div>
            <h1 className="text-xl font-serif text-foreground">{caseData.service_code} — {svc?.name || "Service"}</h1>
            <p className="text-sm font-sans text-muted-foreground mt-1">Patient: {caseData.patient_ref || "—"} · Submitted {formatDate(caseData.created_at)}</p>
            {caseData.clinical_notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-sans font-medium text-muted-foreground mb-1">Clinical Notes</p>
                <p className="text-sm font-sans text-foreground whitespace-pre-wrap">{caseData.clinical_notes}</p>
              </div>
            )}
          </div>

          {/* Design QC Release */}
          {caseData.status === "design_review" && (
            <div className="bg-card rounded-xl border-2 border-teal-300 p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Design Quality Check</h3>
              <p className="text-sm font-sans text-muted-foreground mb-4">Review the design files above. If everything looks good, deliver to the client.</p>
              <button onClick={handleReleaseToClient}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-teal-700">
                <Check size={14} /> Deliver to Client
              </button>
            </div>
          )}

          {/* Payment Verification Panel */}
          {caseData.status === "payment_under_verification" && (
            <div className="bg-card rounded-xl border-2 border-yellow-300 p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-4">⚠️ Payment Verification Required</h3>
              <div className="space-y-3 mb-4">
                {caseData.payment_proof_url && proofSignedUrl && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-sans text-muted-foreground">Payment Proof</span>
                    <a href={proofSignedUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-primary hover:underline font-sans">
                      View Proof <ExternalLink size={12} />
                    </a>
                  </div>
                )}
                {caseData.payment_reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-sans text-muted-foreground">Reference</span>
                    <span className="text-sm font-sans font-medium">{caseData.payment_reference}</span>
                  </div>
                )}
                {caseData.payment_submitted_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-sans text-muted-foreground">Submitted</span>
                    <span className="text-sm font-sans">{formatDateTime(caseData.payment_submitted_at)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={handleVerifyPayment}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-green-700">
                  <Check size={14} /> Verify Payment
                </button>
                <button onClick={() => setShowRejectionForm(!showRejectionForm)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-red-700">
                  <X size={14} /> Reject Payment
                </button>
              </div>

              {showRejectionForm && (
                <div className="mt-4 space-y-3">
                  <textarea className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background min-h-[80px]"
                    value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)} placeholder="Reason for rejection (visible to client)..." />
                  <button onClick={handleRejectPayment} disabled={!rejectionNote.trim()}
                    className="w-full bg-red-600 text-white py-2 rounded-lg text-sm font-sans font-medium hover:bg-red-700 disabled:opacity-50">
                    Confirm Rejection & Notify Client
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Payment Verification Info (for verified cases) */}
          {caseData.payment_verified_at && (
            <div className="bg-card rounded-xl border border-green-200 p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Payment Verification</h3>
              <div className="space-y-2 text-sm font-sans">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-green-700 font-medium">Verified ✓</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verified At</span>
                  <span>{formatDateTime(caseData.payment_verified_at)}</span>
                </div>
                {caseData.payment_proof_url && proofSignedUrl && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proof</span>
                    <a href={proofSignedUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline">
                      View <ExternalLink size={12} />
                    </a>
                  </div>
                )}
                {caseData.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-medium">{caseData.payment_reference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Audit Timeline */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Audit Timeline</h3>
            {statusHistory.length === 0 ? (
              <p className="text-sm font-sans text-muted-foreground">No status changes recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {statusHistory.map((h) => (
                  <div key={h.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-sans text-foreground">
                        {h.old_status ? <><span className="text-muted-foreground">{h.old_status.replace(/_/g, " ")}</span> → </> : null}
                        <span className="font-medium">{h.new_status.replace(/_/g, " ")}</span>
                      </p>
                      <p className="text-[10px] font-sans text-muted-foreground">
                        {formatDateTime(h.created_at)}
                        {h.changed_by_role && ` · by ${h.changed_by_role}`}
                      </p>
                      {h.notes && <p className="text-xs font-sans text-muted-foreground mt-0.5">{h.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Data Exchange History */}
          <AdditionalDataTimeline requests={additionalDataRequests} files={files} viewerRole="admin" />

          {/* 48h Warning for awaiting_client_info */}
          {caseData.status === "awaiting_client_info" && (() => {
            const lastRequest = additionalDataRequests.filter(r => r.response_type === "pending").slice(-1)[0];
            if (lastRequest) {
              const hoursSince = (Date.now() - new Date(lastRequest.created_at).getTime()) / 3600000;
              if (hoursSince > 48) {
                return (
                  <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                    <p className="text-sm font-sans font-semibold text-red-800">⚠️ No client response for {Math.floor(hoursSince)}h</p>
                    <p className="text-xs font-sans text-red-700 mt-1">Client has not responded to the additional data request for over 48 hours.</p>
                  </div>
                );
              }
            }
            return null;
          })()}

          {/* All Files */}
          <CaseFileList files={files} title="Case Files" />

          {/* Admin Upload */}
          {user && id && <CaseFileUpload caseId={id} userId={user.id} uploaderRole="admin" onUploaded={loadCase} title="Upload Files" />}

          {/* Design files */}
          {designs.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Design Files</h3>
              <div className="space-y-2">
                {designs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5">
                    <div>
                      <p className="text-sm font-sans">{d.file_name} <span className="text-xs text-muted-foreground">v{d.version}</span></p>
                      {d.notes && <p className="text-xs font-sans text-muted-foreground">{d.notes}</p>}
                    </div>
                    <button onClick={() => downloadCaseFile(d.file_url, d.file_name)} className="text-primary p-1 hover:text-primary/80"><Download size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Payments</h3>
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5 mb-2">
                  <div>
                    <p className="text-sm font-sans">${p.amount_usd} — {p.status} {p.method && `(${p.method})`}</p>
                    {p.paid_at && <p className="text-xs text-muted-foreground">{formatDate(p.paid_at)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Client Feedback for this case */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Client Feedback</h3>
            {caseFeedback ? (
              <div className="space-y-3">
                {caseFeedback.rating && (
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < (caseFeedback.rating || 0) ? "text-amber-400" : "text-muted-foreground/30"}>★</span>
                    ))}
                    <span className="ml-2 text-sm font-sans text-muted-foreground">{caseFeedback.rating}/5</span>
                    {caseFeedback.rating <= 2 && (
                      <span className="ml-2 text-xs font-sans bg-red-100 text-red-700 px-2 py-0.5 rounded">⚠️ Low rating</span>
                    )}
                  </div>
                )}
                {caseFeedback.message && (
                  <p className="text-sm font-sans text-foreground italic bg-muted/40 rounded p-3 whitespace-pre-wrap">"{caseFeedback.message}"</p>
                )}
                <div className="text-xs font-sans text-muted-foreground space-y-1">
                  {caseFeedback.recommends && (
                    <p>Recommends: {caseFeedback.recommends === "yes" ? "👍 Yes" : "👎 Not sure"}</p>
                  )}
                  <p>Submitted: {formatDateTime(caseFeedback.created_at)}</p>
                  {caseFeedback.feedback_source && (
                    <p>Source: {caseFeedback.feedback_source === "case" ? "Case page" : caseFeedback.feedback_source === "email_link" ? "Email link" : "General"}</p>
                  )}
                </div>
                <Link to={`/admin/feedback/${caseFeedback.id}`} className="inline-block text-sm font-sans text-primary hover:underline">View full feedback →</Link>
              </div>
            ) : (
              <p className="text-sm font-sans text-muted-foreground">No feedback received for this case yet.</p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Admin Actions */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Admin Actions</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-sans text-muted-foreground mb-1 block">Assign Designer</label>
                <select className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background" value={assignedDesigner} onChange={(e) => setAssignedDesigner(e.target.value)}>
                  <option value="">Unassigned</option>
                  {designers.map((d) => <option key={d.id} value={d.id}>{d.full_name || d.id.slice(0, 8)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-sans text-muted-foreground mb-1 block">Change Status</label>
                <select className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as CaseStatus)}>
                  {STATUS_ORDER.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-sans text-muted-foreground mb-1 block">Admin Notes (internal)</label>
                <textarea className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background min-h-[80px]" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Internal notes..." />
              </div>
              <button onClick={handleSaveChanges} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-primary/90">
                <Save size={14} /> Save Changes
              </button>
              <button onClick={handleArchive} className="w-full flex items-center justify-center gap-2 border border-border text-muted-foreground py-2.5 rounded-lg text-sm font-sans hover:bg-muted transition-colors">
                <Archive size={14} /> Archive Case
              </button>
            </div>
          </div>

          {/* Quote panel */}
          {isCustomQuote && caseData.status === "awaiting_quote" && !caseData.quoted_price_usd && (
            <div className="bg-card rounded-xl border-2 border-purple-200 p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Send Custom Quote</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-sans text-muted-foreground mb-1 block">Quoted Price (USD)</label>
                  <input type="number" step="0.01" min="0" className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background" value={quotePrice} onChange={(e) => setQuotePrice(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs font-sans text-muted-foreground mb-1 block">Quote Notes (sent to client)</label>
                  <textarea className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background min-h-[60px]" value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} />
                </div>
                <button onClick={handleSendQuote} className="w-full bg-purple-600 text-white py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-purple-700">Send Quote to Client</button>
              </div>
            </div>
          )}

          {/* Messages */}
          {user && id && (
            <CaseMessageThread caseId={id} userId={user.id} senderRole="admin" messages={messages} title="Messages" maxHeight="450px" caseData={{ assigned_designer_id: caseData?.assigned_designer_id, user_id: caseData?.user_id, service_code: caseData?.service_code }} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCaseDetail;
