import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { formatCaseId, formatDate, formatDateTime } from "@/lib/caseHelpers";
import { useToast } from "@/hooks/use-toast";
import { Download, Check, X, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Payment {
  id: string;
  case_id: string;
  user_id: string;
  amount_usd: number;
  method: string | null;
  status: string;
  paid_at: string | null;
  transfer_claimed_at: string | null;
  admin_notes: string | null;
}

const AdminPayments = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("payments").select("*").order("paid_at", { ascending: false, nullsFirst: true });
    setPayments((data || []) as unknown as Payment[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleConfirmPayment = async (payment: Payment) => {
    setActionLoading(true);
    await supabase.from("payments").update({
      status: "paid" as any,
      paid_at: new Date().toISOString(),
      admin_notes: adminNote || null,
    } as any).eq("id", payment.id);
    await supabase.from("cases").update({ status: "paid" as any }).eq("id", payment.case_id);
    toast({ title: "Payment confirmed" });
    setVerifyId(null);
    setAdminNote("");
    setActionLoading(false);
    load();
  };

  const handleRejectPayment = async (payment: Payment) => {
    if (!adminNote.trim()) {
      toast({ title: "Please add a rejection reason", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    await supabase.from("payments").update({
      admin_notes: adminNote,
      transfer_claimed_at: null,
    } as any).eq("id", payment.id);
    toast({ title: "Payment rejected — client will be notified" });
    setVerifyId(null);
    setAdminNote("");
    setActionLoading(false);
    load();
  };

  const handleExportCSV = (rows: Payment[]) => {
    const header = "Date,Case ID,Amount,Method,Status";
    const csvRows = rows.map((p) =>
      `${p.paid_at ? formatDate(p.paid_at) : "—"},${formatCaseId(p.case_id)},${p.amount_usd},${p.method || "—"},${p.status}`
    );
    const csv = [header, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "payments_export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const cardPayments = payments.filter((p) => p.method === "card");
  const bankPayments = payments.filter((p) => p.method === "bank_transfer");
  const pendingPayments = payments.filter((p) => p.status === "pending");

  const getStatusBadge = (p: Payment) => {
    if (p.status === "paid") return { label: "Paid", cls: "bg-emerald-100 text-emerald-700" };
    if (p.status === "pending" && p.transfer_claimed_at) return { label: "Transfer Claimed — Verify", cls: "bg-amber-100 text-amber-700" };
    if (p.status === "pending") return { label: "Pending", cls: "bg-orange-100 text-orange-700" };
    if (p.status === "refunded") return { label: "Refunded", cls: "bg-gray-100 text-gray-600" };
    return { label: p.status, cls: "bg-gray-100 text-gray-600" };
  };

  const renderTable = (rows: Payment[]) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {loading ? (
        <div className="p-10 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground text-sm font-sans">No payments found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="text-left text-xs font-sans text-muted-foreground uppercase tracking-wide bg-muted/30">
              <th className="px-5 py-3">Case</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody>
              {rows.map((p) => {
                const badge = getStatusBadge(p);
                const isClaimed = p.status === "pending" && !!p.transfer_claimed_at;
                return (
                  <tr key={p.id} className={`border-t border-border hover:bg-muted/30 ${isClaimed ? "bg-amber-50/30" : ""}`}>
                    <td className="px-5 py-3 text-sm font-mono">{formatCaseId(p.case_id)}</td>
                    <td className="px-5 py-3 text-sm font-sans font-medium">${p.amount_usd}</td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">{p.method === "bank_transfer" ? "Bank Transfer" : p.method || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-5 py-3 text-sm font-sans text-muted-foreground">
                      {p.paid_at ? formatDate(p.paid_at) : p.transfer_claimed_at ? `Claimed ${formatDateTime(p.transfer_claimed_at)}` : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {p.status === "pending" && (
                        <button onClick={() => { setVerifyId(p.id); setAdminNote(""); }}
                          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-sans hover:bg-primary/90">
                          {isClaimed ? "Review Transfer" : "Verify Payment"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Verification modal */}
      {verifyId && (() => {
        const payment = payments.find((p) => p.id === verifyId);
        if (!payment) return null;
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setVerifyId(null)}>
            <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-serif text-foreground mb-4">Verify Bank Transfer</h3>
              <div className="space-y-2 text-sm font-sans mb-4">
                <div className="flex justify-between"><span className="text-muted-foreground">Case</span><span className="font-mono">{formatCaseId(payment.case_id)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">${payment.amount_usd} USD</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span>{payment.method === "bank_transfer" ? "Bank Transfer" : payment.method || "—"}</span></div>
                {payment.transfer_claimed_at && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Claimed at</span><span>{formatDateTime(payment.transfer_claimed_at)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-semibold">Case #{payment.case_id.slice(0, 8).toUpperCase()}</span></div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-sans font-medium text-foreground mb-1">Admin Notes</label>
                <textarea className="w-full border border-input rounded-lg px-3 py-2 text-sm font-sans bg-background text-foreground focus:ring-2 focus:ring-ring min-h-[80px]"
                  value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Add notes (required for rejection)..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleConfirmPayment(payment)} disabled={actionLoading}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-sans font-medium disabled:opacity-50">
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirm Payment
                </button>
                <button onClick={() => handleRejectPayment(payment)} disabled={actionLoading}
                  className="flex items-center gap-1.5 border border-border text-foreground px-4 py-2 rounded-lg text-sm font-sans hover:bg-muted disabled:opacity-50">
                  <X size={14} /> Reject
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-serif text-foreground">Payments</h1>
        <button onClick={() => handleExportCSV(payments)} className="flex items-center gap-2 border border-border text-foreground px-4 py-2 rounded-lg text-sm font-sans hover:bg-muted transition-colors whitespace-nowrap">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 h-auto flex-wrap">
          <TabsTrigger value="all" className="font-sans">All ({payments.length})</TabsTrigger>
          <TabsTrigger value="card" className="font-sans">Card ({cardPayments.length})</TabsTrigger>
          <TabsTrigger value="bank" className="font-sans">Bank Transfer ({bankPayments.length})</TabsTrigger>
          <TabsTrigger value="pending" className="font-sans">Pending ({pendingPayments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderTable(payments)}</TabsContent>
        <TabsContent value="card">{renderTable(cardPayments)}</TabsContent>
        <TabsContent value="bank">{renderTable(bankPayments)}</TabsContent>
        <TabsContent value="pending">{renderTable(pendingPayments)}</TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminPayments;
