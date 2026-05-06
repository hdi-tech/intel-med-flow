import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail, ADMIN_EMAIL } from "@/lib/emailHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { formatDate } from "@/lib/caseHelpers";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, RefreshCw } from "lucide-react";

interface Consultation {
  id: string;
  client_name: string;
  service_interest: string | null;
  status: string;
  confirmed_slot: any;
  designer_notes: string | null;
  reschedule_reason: string | null;
  created_at: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_review: { label: "Under Review", color: "bg-amber-100 text-amber-800" },
  assigned: { label: "Specialist Assigned", color: "bg-blue-100 text-blue-800" },
  time_proposed: { label: "Scheduling", color: "bg-indigo-100 text-indigo-800" },
  confirmed: { label: "Confirmed", color: "bg-emerald-100 text-emerald-800" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
  reschedule_requested: { label: "Reschedule Requested", color: "bg-orange-100 text-orange-800" },
};

const ClientConsultations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("consultations").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setConsultations((data || []) as unknown as Consultation[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const channel = supabase
      .channel("client-consultations")
      .on("postgres_changes", { event: "*", schema: "public", table: "consultations", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const submitReschedule = async () => {
    if (!rescheduleId || !reason) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("consultations").update({
      status: "reschedule_requested" as any,
      reschedule_reason: `${reason}${preferredTime ? ` | Preferred: ${preferredTime}` : ""}`,
    } as any).eq("id", rescheduleId);

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    const consult = consultations.find((c) => c.id === rescheduleId);
    sendEmail("consultation-reschedule", ADMIN_EMAIL, {
      clientName: consult?.client_name,
      reason,
      preferredTime,
    });

    toast({ title: "Reschedule request submitted" });
    setRescheduleId(null);
    setReason("");
    setPreferredTime("");
    load();
  };

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">My Consultations</h1>

      {consultations.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <p className="text-muted-foreground font-sans text-sm mb-2">No consultation requests yet.</p>
          <p className="text-muted-foreground font-sans text-xs">Use the "Book a consultation" button on the homepage to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => {
            const s = statusLabels[c.status] || { label: c.status, color: "bg-gray-100" };
            return (
              <div key={c.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-sans font-medium text-foreground">{c.service_interest || "General Consultation"}</p>
                    <p className="text-xs font-sans text-muted-foreground mt-1">
                      <Clock size={12} className="inline mr-1" />
                      Submitted {formatDate(c.created_at)}
                    </p>
                  </div>
                  <span className={`text-xs font-sans font-medium px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>
                </div>

                {c.confirmed_slot && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm font-sans text-emerald-800 mb-3">
                    <Calendar size={14} className="inline mr-1" />
                    <strong>Meeting:</strong> {c.confirmed_slot.date} at {c.confirmed_slot.time}
                  </div>
                )}

                {c.designer_notes && (
                  <p className="text-sm font-sans text-muted-foreground italic mb-3">Note from specialist: {c.designer_notes}</p>
                )}

                {c.status === "confirmed" && (
                  <button
                    onClick={() => setRescheduleId(c.id)}
                    className="flex items-center gap-1 text-sm font-sans text-orange-600 hover:underline"
                  >
                    <RefreshCw size={14} /> Request Reschedule
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleId} onOpenChange={(o) => !o && setRescheduleId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Request Reschedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="font-sans text-xs">Reason for rescheduling *</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Why do you need to reschedule?" />
            </div>
            <div>
              <Label className="font-sans text-xs">Preferred alternative time (optional)</Label>
              <Input value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} placeholder="e.g. Any weekday after 3pm GST" />
            </div>
            <button
              onClick={submitReschedule}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg text-sm font-sans font-medium"
            >
              Submit Reschedule Request
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientConsultations;
