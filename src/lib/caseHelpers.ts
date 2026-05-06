export type CaseStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "awaiting_client_info"
  | "additional_data_review"
  | "awaiting_quote"
  | "quote_accepted"
  | "in_design"
  | "design_review"
  | "revision_requested"
  | "pending_client_approval"
  | "awaiting_payment"
  | "payment_under_verification"
  | "payment_verified"
  | "final_delivery_submitted"
  | "delivered"
  // Legacy statuses kept for backward compat
  | "paid";

export const STATUS_CONFIG: Record<CaseStatus, { label: string; color: string; bg: string; border?: string; clientAction?: boolean }> = {
  draft: { label: "Draft", color: "text-gray-600", bg: "bg-gray-100" },
  submitted: { label: "Submitted", color: "text-blue-700", bg: "bg-blue-100" },
  under_review: { label: "Under Review", color: "text-sky-700", bg: "bg-sky-100" },
  awaiting_client_info: { label: "Awaiting Client Info", color: "text-orange-700", bg: "bg-orange-100", border: "border-l-orange-400", clientAction: true },
  additional_data_review: { label: "Files Under Review", color: "text-violet-700", bg: "bg-violet-100", border: "border-l-violet-400" },
  awaiting_quote: { label: "Awaiting Quote", color: "text-purple-700", bg: "bg-purple-100" },
  quote_accepted: { label: "Quote Accepted", color: "text-teal-700", bg: "bg-teal-100" },
  in_design: { label: "In Design", color: "text-indigo-700", bg: "bg-indigo-100" },
  design_review: { label: "Design Review", color: "text-teal-700", bg: "bg-teal-100", border: "border-l-teal-400", clientAction: true },
  revision_requested: { label: "Revision Requested", color: "text-amber-700", bg: "bg-amber-100", border: "border-l-amber-400", clientAction: true },
  pending_client_approval: { label: "Pending Client Approval", color: "text-cyan-700", bg: "bg-cyan-100", border: "border-l-cyan-400", clientAction: true },
  awaiting_payment: { label: "Awaiting Payment", color: "text-orange-700", bg: "bg-orange-100", border: "border-l-orange-400", clientAction: true },
  payment_under_verification: { label: "Payment Under Review", color: "text-yellow-700", bg: "bg-yellow-100" },
  payment_verified: { label: "Pending Assignment", color: "text-blue-700", bg: "bg-blue-100" },
  final_delivery_submitted: { label: "Final Delivery Submitted", color: "text-emerald-700", bg: "bg-emerald-100" },
  delivered: { label: "Delivered", color: "text-emerald-800", bg: "bg-emerald-100" },
  paid: { label: "Paid", color: "text-green-700", bg: "bg-green-100" },
};

// Designer-friendly status labels (hides payment details)
export const DESIGNER_STATUS_LABELS: Partial<Record<CaseStatus, string>> = {
  pending_client_approval: "Pending Client Approval",
  awaiting_payment: "Pending Client Payment",
  payment_under_verification: "Payment Processing",
  payment_verified: "Ready for Final Delivery",
  final_delivery_submitted: "Final Delivery Submitted",
  awaiting_client_info: "Awaiting Client Info",
  additional_data_review: "Client Files Under Review",
};

export function getDesignerStatusLabel(status: CaseStatus): string {
  return DESIGNER_STATUS_LABELS[status] || STATUS_CONFIG[status]?.label || status;
}

// Single source of truth status order
export const STATUS_ORDER: CaseStatus[] = [
  "draft", "submitted", "under_review", "awaiting_client_info", "additional_data_review", "awaiting_quote", "quote_accepted",
  "in_design", "design_review", "revision_requested", "pending_client_approval",
  "awaiting_payment", "payment_under_verification", "payment_verified",
  "final_delivery_submitted", "paid", "delivered",
];

// Unified timeline — single source of truth for ALL roles
export const UNIFIED_TIMELINE_STAGES: { status: CaseStatus; label: string; conditional?: boolean }[] = [
  { status: "draft", label: "Draft" },
  { status: "submitted", label: "Submitted" },
  { status: "under_review", label: "Under Review" },
  { status: "awaiting_client_info", label: "Awaiting Client Info", conditional: true },
  { status: "additional_data_review", label: "Files Under Review", conditional: true },
  { status: "awaiting_quote", label: "Awaiting Quote" },
  { status: "quote_accepted", label: "Quote Accepted" },
  { status: "in_design", label: "In Design" },
  { status: "design_review", label: "Design Review" },
  { status: "revision_requested", label: "Revision Requested", conditional: true },
  { status: "pending_client_approval", label: "Pending Client Approval" },
  { status: "awaiting_payment", label: "Awaiting Payment" },
  { status: "payment_under_verification", label: "Payment Under Review" },
  { status: "payment_verified", label: "Pending Assignment" },
  { status: "final_delivery_submitted", label: "Final Delivery Submitted" },
  { status: "paid", label: "Paid" },
  { status: "delivered", label: "Delivered" },
];

// Legacy aliases — point to unified timeline
export const TIMELINE_STAGES = UNIFIED_TIMELINE_STAGES;
export const CLIENT_TIMELINE_STAGES = UNIFIED_TIMELINE_STAGES;
export const DESIGNER_TIMELINE_STAGES = UNIFIED_TIMELINE_STAGES;

// Designer-visible statuses for active tab
export const DESIGNER_ACTIVE_STATUSES: CaseStatus[] = [
  "submitted", "under_review", "awaiting_client_info", "additional_data_review", "awaiting_quote", "quote_accepted",
  "revision_requested", "in_design", "design_review",
  "pending_client_approval", "payment_verified", "final_delivery_submitted",
];

// Admin tab groupings — Needs Action includes payment review, pending assignment, design review
export const ADMIN_NEEDS_ACTION_STATUSES: CaseStatus[] = [
  "submitted", "revision_requested", "awaiting_quote",
  "payment_under_verification", "payment_verified", "design_review",
  "additional_data_review",
  "paid", // Legacy status — treat as needing assignment
];
export const ADMIN_ACTIVE_STATUSES: CaseStatus[] = [
  "under_review", "awaiting_client_info", "additional_data_review", "quote_accepted", "in_design",
  "pending_client_approval", "awaiting_payment",
  "final_delivery_submitted",
];

export const FILE_REQUIREMENTS: Record<string, { required: string[]; optional?: string[] }> = {
  D01: { required: ["Upper STL", "Lower STL", "Bite Scan STL"] },
  D02: { required: ["Upper STL", "Lower STL", "Bite Scan STL", "Implant Position STL"] },
  D03: { required: ["Upper STL", "Lower STL", "Bite Scan STL", "Implant Position STL"] },
  D04: { required: ["Upper STL", "Lower STL", "Bite Scan STL", "Implant Position STL"] },
  D05: { required: ["Upper STL", "Lower STL", "Bite Scan STL"] },
  D06: { required: ["Upper STL", "Lower STL", "Bite Scan STL"] },
  D07: { required: ["Upper STL", "Lower STL", "Bite Scan STL", "Implant Position STL"] },
  D08: { required: ["Upper STL", "Lower STL", "Bite Scan STL"] },
  D09: { required: ["Upper STL", "Lower STL", "Bite Scan STL", "CBCT DICOM ZIP"] },
  RE01: { required: ["CBCT DICOM folder (ZIP)"] },
  RE02: { required: ["CBCT DICOM folder (ZIP)"] },
  RE03: { required: ["Lateral Cephalometric X-ray (JPG/PNG)"] },
  RE04: { required: ["Lateral Ceph X-ray", "Full face smile photo", "Full face rest photo", "Lateral smile photo", "Intraoral frontal photo", "Intraoral right photo", "Intraoral left photo"] },
  RE05: { required: ["CBCT DICOM folder (ZIP)"] },
  SG01: { required: ["Upper STL", "Lower STL", "CBCT DICOM folder (ZIP)"] },
  SG02: { required: ["Upper STL", "Lower STL", "CBCT DICOM folder (ZIP)"] },
  SG03: { required: ["Upper STL", "Lower STL", "CBCT DICOM folder (ZIP)"] },
  SG04: { required: ["Upper STL", "Lower STL", "CBCT DICOM folder (ZIP)"] },
  SG05: { required: ["Upper STL", "Lower STL", "CBCT DICOM folder (ZIP)"] },
  SG06: { required: ["Upper STL", "Lower STL", "CBCT DICOM folder (ZIP)"] },
  SG07: { required: ["Upper STL", "Lower STL", "CBCT DICOM folder (ZIP)"] },
  SG08: { required: ["Upper STL", "Lower STL", "CBCT DICOM folder (ZIP)"] },
  SG09: { required: ["Upper STL", "Lower STL", "CBCT DICOM folder (ZIP)"] },
  DSD01: { required: ["Full face smile photo", "Full face rest photo", "Lateral smile photo", "Intraoral frontal photo", "Intraoral right photo", "Intraoral left photo"] },
  DSD02: { required: ["Full face smile photo", "Full face rest photo", "Lateral smile photo", "Intraoral frontal photo", "Intraoral right photo", "Intraoral left photo", "Upper STL", "Lower STL"] },
  CA01: { required: ["Upper STL", "Lower STL", "Full face smile photo", "Full face rest photo", "Lateral smile photo", "Intraoral frontal photo", "Intraoral right photo", "Intraoral left photo"], optional: ["Lateral Ceph X-ray"] },
  CA02: { required: ["Upper STL", "Lower STL", "Full face smile photo", "Full face rest photo", "Lateral smile photo", "Intraoral frontal photo", "Intraoral right photo", "Intraoral left photo"], optional: ["Lateral Ceph X-ray"] },
  CA03: { required: ["Upper STL", "Lower STL", "Full face smile photo", "Full face rest photo", "Lateral smile photo", "Intraoral frontal photo", "Intraoral right photo", "Intraoral left photo"], optional: ["Lateral Ceph X-ray"] },
};

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatCaseId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
