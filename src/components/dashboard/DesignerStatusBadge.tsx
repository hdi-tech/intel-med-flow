import { getDesignerStatusLabel, STATUS_CONFIG, type CaseStatus } from "@/lib/caseHelpers";

const DESIGNER_BADGE_OVERRIDES: Partial<Record<CaseStatus, { color: string; bg: string }>> = {
  pending_client_approval: { color: "text-cyan-700", bg: "bg-cyan-100" },
  awaiting_payment: { color: "text-sky-700", bg: "bg-sky-100" },
  payment_under_verification: { color: "text-sky-700", bg: "bg-sky-100" },
  payment_verified: { color: "text-amber-700", bg: "bg-amber-100" },
  final_delivery_submitted: { color: "text-emerald-700", bg: "bg-emerald-100" },
  awaiting_client_info: { color: "text-orange-700", bg: "bg-orange-100" },
};

const DesignerStatusBadge = ({ status, size = "sm" }: { status: CaseStatus; size?: "sm" | "lg" }) => {
  const override = DESIGNER_BADGE_OVERRIDES[status];
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const bg = override?.bg || config.bg;
  const color = override?.color || config.color;
  const label = getDesignerStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium font-sans ${bg} ${color} ${
        size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      {label}
    </span>
  );
};

export default DesignerStatusBadge;
