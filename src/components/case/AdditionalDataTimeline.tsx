import { useState } from "react";
import { formatDateTime } from "@/lib/caseHelpers";
import { FileText, MessageSquare, Check, AlertCircle, RotateCcw } from "lucide-react";
import type { CaseFileItem } from "./CaseFileList";
import { downloadCaseFile } from "@/lib/storageHelpers";

export interface AdditionalDataRequest {
  id: string;
  case_id: string;
  requested_by: string;
  request_message: string;
  response_type: string;
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  requests: AdditionalDataRequest[];
  files: CaseFileItem[];
  /** Role viewing this component */
  viewerRole: "client" | "designer" | "admin";
  /** Actions for designer only */
  onApprove?: (requestId: string) => void;
  onRequestMore?: (requestId: string, message: string) => void;
  onReject?: (requestId: string, message: string) => void;
}

const responseTypeConfig: Record<string, { label: string; color: string; icon: typeof Check }> = {
  pending: { label: "Awaiting Review", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: Check },
  more_needed: { label: "More Info Needed", color: "bg-orange-100 text-orange-700", icon: RotateCcw },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

export default function AdditionalDataTimeline({ requests, files, viewerRole, onApprove, onRequestMore, onReject }: Props) {
  if (requests.length === 0) return null;

  // Get files uploaded by client after each request
  const getClientFilesAfterRequest = (request: AdditionalDataRequest, nextRequest?: AdditionalDataRequest) => {
    const afterTime = new Date(request.created_at).getTime();
    const beforeTime = nextRequest ? new Date(nextRequest.created_at).getTime() : Infinity;
    return files.filter(
      (f) => f.uploader_role === "client" && new Date(f.created_at).getTime() > afterTime && new Date(f.created_at).getTime() < beforeTime
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-sans font-semibold text-foreground mb-4 flex items-center gap-2">
        <FileText size={16} /> Additional Data Requests
      </h3>
      <div className="space-y-4">
        {requests.map((req, idx) => {
          const config = responseTypeConfig[req.response_type] || responseTypeConfig.pending;
          const Icon = config.icon;
          const clientFiles = getClientFilesAfterRequest(req, requests[idx + 1]);

          return (
            <div key={req.id} className="border border-border rounded-lg overflow-hidden">
              {/* Request header */}
              <div className="bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wide">
                    Request #{idx + 1}
                  </span>
                  <span className={`text-[10px] font-sans font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${config.color}`}>
                    <Icon size={10} className="inline mr-1" />
                    {config.label}
                  </span>
                </div>
                <p className="text-xs font-sans text-muted-foreground">{formatDateTime(req.created_at)}</p>
              </div>

              <div className="px-4 py-3 space-y-3">
                {/* Designer's request message */}
                <div className="flex items-start gap-2">
                  <MessageSquare size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-sans text-muted-foreground mb-0.5">Designer Request</p>
                    <p className="text-sm font-sans text-foreground whitespace-pre-wrap">{req.request_message}</p>
                  </div>
                </div>

                {/* Client uploaded files */}
                {clientFiles.length > 0 && (
                  <div>
                    <p className="text-xs font-sans text-muted-foreground mb-1">Client Uploaded Files</p>
                    <div className="space-y-1">
                      {clientFiles.map((f) => (
                        <div key={f.id} className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-sans text-foreground truncate">{f.file_name}</p>
                            <p className="text-[10px] font-sans text-muted-foreground">{formatDateTime(f.created_at)}</p>
                          </div>
                          <button onClick={() => downloadCaseFile(f.file_url, f.file_name)} className="text-primary text-xs hover:underline shrink-0 ml-2">
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Designer response */}
                {req.response_message && (
                  <div className="flex items-start gap-2">
                    <MessageSquare size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-sans text-muted-foreground mb-0.5">Designer Response</p>
                      <p className="text-sm font-sans text-foreground whitespace-pre-wrap">{req.response_message}</p>
                      {req.responded_at && (
                        <p className="text-[10px] font-sans text-muted-foreground mt-0.5">{formatDateTime(req.responded_at)}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Designer action buttons — only on pending requests */}
                {viewerRole === "designer" && req.response_type === "pending" && clientFiles.length > 0 && (
                  <DesignerActions requestId={req.id} onApprove={onApprove} onRequestMore={onRequestMore} onReject={onReject} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesignerActions({
  requestId,
  onApprove,
  onRequestMore,
  onReject,
}: {
  requestId: string;
  onApprove?: (id: string) => void;
  onRequestMore?: (id: string, msg: string) => void;
  onReject?: (id: string, msg: string) => void;
}) {
  const [showMore, setShowMore] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="border-t border-border pt-3 space-y-2">
      <div className="flex gap-2">
        <button
          onClick={() => onApprove?.(requestId)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2 rounded-lg text-xs font-sans font-medium hover:bg-emerald-700"
        >
          <Check size={12} /> Approve Files
        </button>
        <button
          onClick={() => { setShowMore(true); setShowReject(false); }}
          className="flex-1 flex items-center justify-center gap-1.5 border border-border text-foreground py-2 rounded-lg text-xs font-sans hover:bg-muted"
        >
          <RotateCcw size={12} /> Request More
        </button>
        <button
          onClick={() => { setShowReject(true); setShowMore(false); }}
          className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 py-2 rounded-lg text-xs font-sans hover:bg-red-50"
        >
          <AlertCircle size={12} /> Reject
        </button>
      </div>
      {(showMore || showReject) && (
        <div className="space-y-2">
          <textarea
            className="w-full border border-input rounded-lg px-3 py-2 text-xs font-sans bg-background min-h-[80px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={showMore ? "Explain what additional files are needed..." : "Explain why files were rejected..."}
          />
          <button
            onClick={() => {
              if (showMore) onRequestMore?.(requestId, message);
              else onReject?.(requestId, message);
              setMessage("");
              setShowMore(false);
              setShowReject(false);
            }}
            disabled={!message.trim()}
            className={`w-full py-2 rounded-lg text-xs font-sans font-medium disabled:opacity-50 ${
              showReject ? "bg-red-600 text-white hover:bg-red-700" : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {showMore ? "Send Request" : "Confirm Rejection"}
          </button>
        </div>
      )}
    </div>
  );
}
