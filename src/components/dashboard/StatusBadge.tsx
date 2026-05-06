import { STATUS_CONFIG, type CaseStatus } from "@/lib/caseHelpers";

const StatusBadge = ({ status, size = "sm" }: { status: CaseStatus; size?: "sm" | "lg" }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium font-sans ${config.bg} ${config.color} ${
        size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
