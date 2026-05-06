import { useBankSettings } from "@/hooks/useBankSettings";
import { Building2, Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  caseId?: string;
  compact?: boolean;
}

const BankTransferDetails = ({ caseId, compact = false }: Props) => {
  const { bank, loading } = useBankSettings();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  if (loading) return <div className="animate-pulse bg-muted rounded-lg h-48" />;
  if (!bank) return <p className="text-sm text-muted-foreground font-sans">Bank details unavailable. Contact info@hdi-tech.com</p>;

  const rows = [
    { label: "Bank", value: bank.bank_name },
    { label: "Account Name", value: bank.account_title },
    { label: "Account Number", value: bank.account_number },
    { label: "IBAN", value: bank.iban, copyable: true },
    { label: "Swift Code", value: bank.swift_code || "—" },
    { label: "Currency", value: bank.currency },
    { label: "Branch", value: bank.branch || "—" },
  ];

  if (compact) {
    return (
      <div className="space-y-2 text-sm font-sans">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-4">
            <span className="text-muted-foreground shrink-0">{r.label}</span>
            <span className="text-foreground font-medium text-right break-all">{r.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={18} className="text-primary" />
        <h3 className="text-sm font-sans font-semibold text-foreground uppercase tracking-wide">Bank Transfer Details</h3>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4">
            <span className="text-sm font-sans text-muted-foreground shrink-0">{r.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-sans text-foreground font-medium text-right break-all">{r.value}</span>
              {r.copyable && (
                <button onClick={() => copyToClipboard(r.value, r.label)} className="text-muted-foreground hover:text-primary p-0.5">
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {caseId && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm font-sans text-muted-foreground">Reference</span>
            <span className="text-sm font-sans text-foreground font-semibold">Case #{caseId.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs font-sans text-amber-800">
              ⚠️ Please use your Case ID as payment reference so we can identify your transfer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankTransferDetails;
