import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DesignerLayout from "@/components/DesignerLayout";
import DesignerStatusBadge from "@/components/dashboard/DesignerStatusBadge";
import CaseFileList, { type CaseFileItem } from "@/components/case/CaseFileList";
import CaseFileUpload from "@/components/case/CaseFileUpload";
import CaseMessageThread, { type CaseMessageItem } from "@/components/case/CaseMessageThread";
import AdditionalDataTimeline, { type AdditionalDataRequest } from "@/components/case/AdditionalDataTimeline";
import {
  formatCaseId, formatDate, formatDateTime, STATUS_ORDER, UNIFIED_TIMELINE_STAGES,
  FILE_REQUIREMENTS, type CaseStatus,
} from "@/lib/caseHelpers";
import { ArrowLeft, Check, Upload, PackageCheck, Play, MessageSquarePlus, FileUp, RotateCcw } from "lucide-react";
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
  created_at: string;
  assigned_designer_id: string | null;
  user_id: string;
  services?: { name: string } | null;
}

interface StatusHistoryRecord {
  id: string; old_status: string | null; new_status: string;
  changed_by_role: string | null; notes: string | null; created_at: string;
}

const DesignerCaseWorkspace = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [files, setFiles] = useState<CaseFileItem[]>([]);
  const [messages, setMessages] = useState<CaseMessageItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryRecord[]>([]);
  const [additionalDataRequests, setAdditionalDataRequests] = useState<AdditionalDataRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Action state
  const [delivering, setDelivering] = useState(false);
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [uploadingDesign, setUploadingDesign] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  const loadCase = async () => {
    if (!id) return;
    const { data: cd } = await supabase.from("cases").select("*, services(name)").eq("id", id).single();
    setCaseData(cd as unknown as CaseData);

    const [{ data: f }, { data: m }, { data: h }, { data: adr }] = await Promise.all([
      supabase.from("case_files").select("*").eq("case_id", id).order("created_at"),
      supabase.from("case_messages").select("*").eq("case_id", id).order("created_at"),
      supabase.from("case_status_history").select("*").eq("case_id", id).order("created_at"),
      supabase.from("additional_data_requests").select("*").eq("case_id", id).order("created_at"),
    ]);
    setFiles((f || []) as CaseFileItem[]);
    setMessages((m || []) as CaseMessageItem[]);
    setStatusHistory((h || []) as StatusHistoryRecord[]);
    setAdditionalDataRequests((adr || []) as unknown as AdditionalDataRequest[]);
    setLoading(false);
  };

  useEffect(() => { loadCase(); }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`designer-case-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case_messages", filter: `case_id=eq.${id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as CaseMessageItem])
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case_files", filter: `case_id=eq.${id}` },
        (payload) => setFiles((prev) => [...prev, payload.new as CaseFileItem])
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "additional_data_requests", filter: `case_id=eq.${id}` },
        () => loadCase()
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cases", filter: `id=eq.${id}` },
        (payload) => setCaseData((prev) => prev ? { ...prev, ...(payload.new as any) } : prev)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const isAssignedDesigner = caseData?.assigned_designer_id === user?.id;

  // --- Action Handlers ---

  const changeStatus = async (newStatus: CaseStatus, note?: string) => {
    if (!id || !user) return;
    const oldStatus = caseData?.status;
    await supabase.from("cases").update({ status: newStatus as any }).eq("id", id);
    await supabase.from("case_status_history").insert({
      case_id: id, old_status: oldStatus, new_status: newStatus,
      changed_by: user.id, changed_by_role: "designer", notes: note || null,
    } as any);
  };

  const handleStartReview = async () => {
    if (caseData?.status === "submitted") {
      await changeStatus("under_review", "Designer started review");
    }
    toast({ title: "Case review started" });
    loadCase();
  };

  const handleAcceptAndStartDesign = async () => {
    await changeStatus("in_design", "Designer accepted case and started design");
    toast({ title: "Case accepted — design started" });
    loadCase();
  };

  const handleRequestInfo = async () => {
    if (!id || !user || !infoMessage.trim()) return;
    // Create additional data request record
    await supabase.from("additional_data_requests").insert({
      case_id: id,
      requested_by: user.id,
      request_message: infoMessage,
    } as any);
    await changeStatus("awaiting_client_info", `Additional info requested: ${infoMessage}`);
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "designer",
      message: `📋 Additional information requested:\n\n${infoMessage}`,
    });
    // Email notification to client
    sendEmail("additional-data-requested", caseData?.user_id || "", {
      caseRef: formatCaseId(id),
      caseId: id,
      designerMessage: infoMessage,
    });
    toast({ title: "Info request sent to client" });
    setInfoMessage("");
    setShowInfoModal(false);
    loadCase();
  };

  // Additional data review actions
  const handleApproveFiles = async (requestId: string) => {
    if (!id || !user) return;
    await supabase.from("additional_data_requests").update({
      response_type: "approved",
      response_message: "Files approved — resuming design work.",
      responded_at: new Date().toISOString(),
    } as any).eq("id", requestId);
    await changeStatus("in_design", "Designer approved additional files — resuming design");
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "designer",
      message: "✅ Your additional files have been reviewed and accepted. Design work is resuming.",
    });
    sendEmail("additional-data-approved", caseData?.user_id || "", {
      caseRef: formatCaseId(id),
      caseId: id,
    });
    toast({ title: "Files approved — case resumed" });
    loadCase();
  };

  const handleRequestMoreFiles = async (requestId: string, message: string) => {
    if (!id || !user) return;
    await supabase.from("additional_data_requests").update({
      response_type: "more_needed",
      response_message: message,
      responded_at: new Date().toISOString(),
    } as any).eq("id", requestId);
    // Create a new request record
    await supabase.from("additional_data_requests").insert({
      case_id: id,
      requested_by: user.id,
      request_message: message,
    } as any);
    await changeStatus("awaiting_client_info", `More information requested: ${message}`);
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "designer",
      message: `📋 Additional information still needed:\n\n${message}`,
    });
    sendEmail("additional-data-requested", caseData?.user_id || "", {
      caseRef: formatCaseId(id),
      caseId: id,
      designerMessage: message,
    });
    toast({ title: "Request sent — client notified" });
    loadCase();
  };

  const handleRejectFiles = async (requestId: string, message: string) => {
    if (!id || !user) return;
    await supabase.from("additional_data_requests").update({
      response_type: "rejected",
      response_message: message,
      responded_at: new Date().toISOString(),
    } as any).eq("id", requestId);
    // Create a new request for resubmission
    await supabase.from("additional_data_requests").insert({
      case_id: id,
      requested_by: user.id,
      request_message: `Files rejected — please resubmit: ${message}`,
    } as any);
    await changeStatus("awaiting_client_info", `Files rejected: ${message}`);
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "designer",
      message: `❌ Submitted files were rejected:\n\n${message}\n\nPlease upload corrected files.`,
    });
    sendEmail("additional-data-requested", caseData?.user_id || "", {
      caseRef: formatCaseId(id),
      caseId: id,
      designerMessage: `Files rejected: ${message}. Please resubmit.`,
    });
    toast({ title: "Files rejected — client notified" });
    loadCase();
  };

  const handleUploadDesignForReview = async () => {
    if (!user || !id || designFiles.length === 0) return;
    setUploadingDesign(true);
    for (const file of designFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${id}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from("case-files").upload(path, file);
      if (error) { console.error(error); continue; }
      
      await supabase.from("case_files").insert({
        case_id: id, file_name: file.name, file_url: path,
        uploaded_by: user.id, uploader_role: "designer", file_label: "Design File",
      } as any);
    }
    await changeStatus("design_review", `Uploaded ${designFiles.length} design file(s) for review`);
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "designer",
      message: `📐 Design files uploaded for review (${designFiles.length} file${designFiles.length > 1 ? "s" : ""}).`,
    });
    toast({ title: "Design uploaded for review" });
    setDesignFiles([]);
    setUploadingDesign(false);
    loadCase();
  };

  const handleUploadRevision = async () => {
    if (!user || !id || designFiles.length === 0) return;
    setUploadingDesign(true);
    for (const file of designFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${id}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from("case-files").upload(path, file);
      if (error) { console.error(error); continue; }
      
      await supabase.from("case_files").insert({
        case_id: id, file_name: file.name, file_url: path,
        uploaded_by: user.id, uploader_role: "designer", file_label: "Revised Design",
      } as any);
    }
    await changeStatus("design_review", `Uploaded ${designFiles.length} revised file(s)`);
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "designer",
      message: `🔄 Revised design files uploaded (${designFiles.length} file${designFiles.length > 1 ? "s" : ""}).`,
    });
    toast({ title: "Revised design uploaded" });
    setDesignFiles([]);
    setUploadingDesign(false);
    loadCase();
  };

  const handleMarkReady = async () => {
    await changeStatus("pending_client_approval", "Design sent for client approval");
    await supabase.from("case_messages").insert({
      case_id: id!, sender_id: user!.id, sender_role: "designer",
      message: "✅ Design is ready for your review. Please approve or request revisions.",
    });
    toast({ title: "Case sent for client approval" });
    loadCase();
  };

  const handleDeliverFiles = async () => {
    if (!user || !id || deliveryFiles.length === 0) return;
    setDelivering(true);
    for (const file of deliveryFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${id}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from("case-files").upload(path, file);
      if (error) { console.error(error); continue; }
      
      await supabase.from("case_files").insert({
        case_id: id, file_name: file.name, file_url: path,
        uploaded_by: user.id, uploader_role: "designer", file_label: "Final Delivery",
      } as any);
    }
    await supabase.from("cases").update({ status: "design_review" as any }).eq("id", id);
    await supabase.from("case_status_history").insert({
      case_id: id, old_status: caseData?.status, new_status: "design_review",
      changed_by: user.id, changed_by_role: "designer",
      notes: `Final files uploaded (${deliveryFiles.length} file${deliveryFiles.length > 1 ? "s" : ""}) — awaiting admin QC`,
    } as any);
    await supabase.from("case_messages").insert({
      case_id: id, sender_id: user.id, sender_role: "designer",
      message: `📦 Final delivery files uploaded (${deliveryFiles.length} file${deliveryFiles.length > 1 ? "s" : ""}). Awaiting admin quality check.`,
    });
    toast({ title: "Files submitted for QC review", description: "Admin will review and deliver to client." });
    setDeliveryFiles([]);
    setDelivering(false);
    loadCase();
  };

  if (loading) {
    return <DesignerLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></DesignerLayout>;
  }

  if (!caseData) {
    return <DesignerLayout><div className="text-center py-20 text-muted-foreground font-sans">Case not found.</div></DesignerLayout>;
  }

  const svc = caseData.services as any;
  const fileReqs = caseData.service_code ? FILE_REQUIREMENTS[caseData.service_code] : null;
  const currentStageIdx = STATUS_ORDER.indexOf(caseData.status);
  const isPaymentVerified = caseData.status === "payment_verified";
  const isDelivered = caseData.status === "delivered";
  const isNewlyAssigned = ["submitted", "under_review"].includes(caseData.status);
  const isInDesign = caseData.status === "in_design";
  const isRevisionRequested = caseData.status === "revision_requested";
  const canDesign = ["in_design", "design_review"].includes(caseData.status);
  const isWaitingPayment = ["pending_client_approval", "awaiting_payment", "payment_under_verification"].includes(caseData.status);
  const isAdditionalDataReview = caseData.status === "additional_data_review";
  const pendingRequests = additionalDataRequests.filter((r) => r.response_type === "pending");

  // File upload component for design/revision
  const renderFileUploadArea = (
    fileState: File[], setFileState: (f: File[]) => void,
    inputId: string, onSubmit: () => void, submitting: boolean, label: string
  ) => (
    <div className="bg-card rounded-xl border-2 border-primary/30 p-5">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-3 flex items-center gap-2">
        <Upload size={16} /> {label}
      </h3>
      <div
        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 cursor-pointer transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); setFileState(Array.from(e.dataTransfer.files)); }}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-sans text-foreground">Drag & drop or click to browse</p>
        <p className="text-xs font-sans text-muted-foreground mt-1">STL, DCM, ZIP, PDF, JPG, PNG</p>
        <input id={inputId} type="file" multiple className="hidden" accept=".stl,.dcm,.zip,.pdf,.jpg,.jpeg,.png" onChange={(e) => setFileState(Array.from(e.target.files || []))} />
      </div>
      {fileState.length > 0 && (
        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            {fileState.map((f, i) => (
              <p key={i} className="text-sm font-sans text-foreground">📄 {f.name}</p>
            ))}
          </div>
          <button onClick={onSubmit} disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-primary/90 disabled:opacity-50">
            {submitting ? "Uploading..." : "Submit"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <DesignerLayout>
      <Link to="/designer" className="inline-flex items-center gap-1 text-sm font-sans text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={14} /> Back to queue
      </Link>

      {/* Status banners */}
      {isPaymentVerified && (
        <div className="mb-4 bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <PackageCheck size={24} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-base font-sans font-semibold text-amber-800">Ready for Final Delivery</p>
              <p className="text-sm font-sans text-amber-700 mt-1">Payment verified. Upload final files and deliver to the client.</p>
            </div>
          </div>
        </div>
      )}

      {isWaitingPayment && (
        <div className="mb-4 bg-sky-50 border border-sky-200 rounded-xl p-4">
          <p className="text-sm font-sans font-medium text-sky-800">⏳ Waiting for client payment and verification. You'll be notified when confirmed.</p>
        </div>
      )}

      {isDelivered && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm font-sans font-medium text-emerald-800">✅ This case has been delivered.</p>
        </div>
      )}

      {isAdditionalDataReview && (
        <div className="mb-4 bg-violet-50 border-2 border-violet-300 rounded-xl p-5">
          <p className="text-base font-sans font-semibold text-violet-800">📁 Client has uploaded additional files</p>
          <p className="text-sm font-sans text-violet-700 mt-1">Review the uploaded files below and approve, request more, or reject them.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-sm font-mono text-muted-foreground">{formatCaseId(caseData.id)}</span>
              <DesignerStatusBadge status={caseData.status} size="lg" />
            </div>
            <h1 className="text-xl font-serif text-foreground">{caseData.service_code} — {svc?.name || "Service"}</h1>
            <p className="text-sm font-sans text-muted-foreground mt-1">Patient: {caseData.patient_ref || "—"} · {caseData.delivery_type === "rush" ? "Rush 24h" : "Standard 48h"}</p>
          </div>

          {/* Clinical Brief */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-sans font-semibold text-foreground mb-3">Clinical Brief</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-sans text-muted-foreground">Service</p>
                <p className="text-sm font-sans">{caseData.service_code} — {svc?.name}</p>
              </div>
              {caseData.clinical_notes && (
                <div>
                  <p className="text-xs font-sans text-muted-foreground">Clinical Notes</p>
                  <p className="text-sm font-sans text-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3 mt-1">{caseData.clinical_notes}</p>
                </div>
              )}
              {fileReqs && (
                <div>
                  <p className="text-xs font-sans text-muted-foreground">Required Deliverables</p>
                  <ul className="mt-1 space-y-1">
                    {fileReqs.required.map((f) => (
                      <li key={f} className="text-xs font-sans text-muted-foreground">✱ {f}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-xs font-sans text-muted-foreground">Consultation</p>
                <p className="text-sm font-sans">{caseData.consultation_requested ? "Yes — requested" : "No"}</p>
              </div>
            </div>
          </div>

          {/* Additional Data Timeline */}
          <AdditionalDataTimeline
            requests={additionalDataRequests}
            files={files}
            viewerRole="designer"
            onApprove={handleApproveFiles}
            onRequestMore={handleRequestMoreFiles}
            onReject={handleRejectFiles}
          />

          {/* Case Files */}
          <CaseFileList files={files} title="Case Files" />

          {/* Designer Actions Card */}
          {isAssignedDesigner && !isDelivered && !isWaitingPayment && (
            <div className="bg-card rounded-xl border-2 border-primary/20 p-5">
              <h3 className="text-sm font-sans font-semibold text-foreground mb-4">Actions</h3>

              {/* Newly assigned: submitted / under_review */}
              {isNewlyAssigned && (
                <div className="space-y-3">
                  {caseData.status === "submitted" && (
                    <button onClick={handleStartReview}
                      className="w-full flex items-center justify-center gap-2 border border-border text-foreground py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-muted transition-colors">
                      <Play size={14} /> Start Review
                    </button>
                  )}
                  <button onClick={() => setShowInfoModal(true)}
                    className="w-full flex items-center justify-center gap-2 border border-border text-foreground py-2.5 rounded-lg text-sm font-sans hover:bg-muted transition-colors">
                    <MessageSquarePlus size={14} /> Request Additional Information
                  </button>
                  <button onClick={handleAcceptAndStartDesign}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-primary/90">
                    <Check size={14} /> Accept Case & Start Design
                  </button>
                </div>
              )}

              {/* In design: upload for review */}
              {isInDesign && (
                <div className="space-y-3">
                  {renderFileUploadArea(designFiles, setDesignFiles, "design-upload", handleUploadDesignForReview, uploadingDesign, "Upload Design for Review")}
                  <button onClick={() => setShowInfoModal(true)}
                    className="w-full flex items-center justify-center gap-2 border border-border text-foreground py-2.5 rounded-lg text-sm font-sans hover:bg-muted transition-colors">
                    <MessageSquarePlus size={14} /> Request Additional Information
                  </button>
                  <button onClick={handleMarkReady}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-primary/90">
                    <Check size={14} /> Send for Client Approval
                  </button>
                </div>
              )}

              {/* Design review — can still upload more or send for approval */}
              {caseData.status === "design_review" && (
                <div className="space-y-3">
                  {renderFileUploadArea(designFiles, setDesignFiles, "design-upload-review", handleUploadDesignForReview, uploadingDesign, "Upload Additional Design Files")}
                  <button onClick={handleMarkReady}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-sans font-medium hover:bg-primary/90">
                    <Check size={14} /> Send for Client Approval
                  </button>
                </div>
              )}

              {/* Revision requested */}
              {isRevisionRequested && (
                <div className="space-y-3">
                  {renderFileUploadArea(designFiles, setDesignFiles, "revision-upload", handleUploadRevision, uploadingDesign, "Upload Revised Design")}
                </div>
              )}

              {/* Payment verified — final delivery */}
              {isPaymentVerified && (
                <div className="space-y-3">
                  {renderFileUploadArea(deliveryFiles, setDeliveryFiles, "delivery-upload", handleDeliverFiles, delivering, "Upload Final Files & Deliver")}
                </div>
              )}

              {/* Awaiting client info */}
              {caseData.status === "awaiting_client_info" && (
                <p className="text-sm font-sans text-muted-foreground">Waiting for client to provide requested information.</p>
              )}

              {/* Additional data review — handled by timeline above */}
              {isAdditionalDataReview && (
                <p className="text-sm font-sans text-muted-foreground">Review the uploaded files in the Additional Data section above.</p>
              )}
            </div>
          )}

          {/* Read-only notice for non-assigned designers */}
          {!isAssignedDesigner && (
            <div className="bg-muted/50 rounded-xl border border-border p-4">
              <p className="text-sm font-sans text-muted-foreground">You are viewing this case in read-only mode.</p>
            </div>
          )}

          {/* Status Timeline — unified */}
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
                  <div key={stage.status} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-gray-100 border border-gray-200"}`}>
                        {isCompleted && <Check size={12} />}
                        {isCurrent && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      {i < arr.length - 1 && <div className={`w-0.5 h-6 ${isCompleted ? "bg-primary" : "bg-gray-200"}`} />}
                    </div>
                    <div className="pb-4">
                      <p className={`text-sm font-sans ${isCurrent ? "font-semibold text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                        {stage.label}
                      </p>
                      {historyEntry && (
                        <p className="text-[10px] font-sans text-muted-foreground">{formatDateTime(historyEntry.created_at)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — Messages */}
        <div className="lg:col-span-2">
          <div className="sticky top-20">
            {user && id && (
              <CaseMessageThread
                caseId={id}
                userId={user.id}
                senderRole="designer"
                messages={messages}
                title="Case Messages"
                maxHeight="600px"
                caseData={{ assigned_designer_id: caseData?.assigned_designer_id, user_id: caseData?.user_id || undefined, service_code: caseData?.service_code }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Request Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
            <h3 className="text-base font-sans font-semibold text-foreground mb-3">Request Additional Information</h3>
            <p className="text-sm font-sans text-muted-foreground mb-4">Describe what information or files you need from the client.</p>
            <textarea
              className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background min-h-[120px] mb-4"
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              placeholder="e.g. Please upload a lateral cephalometric X-ray and provide the implant system used..."
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowInfoModal(false); setInfoMessage(""); }}
                className="flex-1 border border-border text-foreground py-2 rounded-lg text-sm font-sans hover:bg-muted">
                Cancel
              </button>
              <button onClick={handleRequestInfo} disabled={!infoMessage.trim()}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-sans font-medium hover:bg-primary/90 disabled:opacity-50">
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </DesignerLayout>
  );
};

export default DesignerCaseWorkspace;
