import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DesignerLayout from "@/components/DesignerLayout";
import { formatDate } from "@/lib/caseHelpers";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Send, Eye, Check } from "lucide-react";

interface Consultation {
  id: string;
  client_name: string;
  email: string;
  phone: string;
  country: string;
  specialty: string | null;
  service_interest: string | null;
  description: string | null;
  timezone: string | null;
  status: string;
  proposed_slots: any;
  confirmed_slot: any;
  designer_notes: string | null;
  created_at: string;
}

const DesignerConsultations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("consultations").select("*")
      .eq("assigned_designer_id", user.id).order("created_at", { ascending: false });
    setConsultations((data || []) as unknown as Consultation[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!user) return;
    const channel = supabase
      .channel("designer-consultations")
      .on("postgres_changes", { event: "*", schema: "public", table: "consultations", filter: `assigned_designer_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const openDetail = (c: Consultation) => {
    setSelected(c);
    setSelectedSlotIdx(null);
    setNotes(c.designer_notes || "");
  };

  const submitSelection = async () => {
    if (!selected) return;
    if (selectedSlotIdx === null) {
      toast({ title: "Please select one of the client's time slots", variant: "destructive" });
      return;
    }

    const chosenSlot = selected.proposed_slots[selectedSlotIdx];

    const { error } = await supabase.from("consultations").update({
      confirmed_slot: chosenSlot,
      designer_notes: notes || null,
      status: "time_proposed" as any,
    } as any).eq("id", selected.id);

    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Selected slot submitted to admin for approval" });
    load();
    setSelected(null);
  };

  const statusColors: Record<string, string> = {
    assigned: "bg-blue-100 text-blue-800",
    time_proposed: "bg-indigo-100 text-indigo-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
    reschedule_requested: "bg-orange-100 text-orange-800",
  };

  if (loading) return <DesignerLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></DesignerLayout>;

  return (
    <DesignerLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">My Consultations</h1>

      {consultations.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <p className="text-muted-foreground font-sans text-sm">No consultations assigned to you yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => (
            <div key={c.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-sans font-medium text-foreground">{c.client_name}</p>
                  <p className="text-sm font-sans text-muted-foreground">{c.service_interest || "General consultation"} • {c.country}</p>
                </div>
                <span className={`text-xs font-sans font-medium px-2 py-1 rounded-full ${statusColors[c.status] || "bg-gray-100"}`}>
                  {c.status.replace(/_/g, " ")}
                </span>
              </div>
              {c.description && <p className="text-sm font-sans text-muted-foreground mb-3">{c.description}</p>}
              {c.confirmed_slot && c.status === "confirmed" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-sm font-sans text-emerald-800 mb-3">
                  <Calendar size={14} className="inline mr-1" />
                  Confirmed: {c.confirmed_slot.date} at {c.confirmed_slot.time}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-muted-foreground">{formatDate(c.created_at)}</span>
                {c.status === "assigned" || c.status === "reschedule_requested" ? (
                  <button onClick={() => openDetail(c)} className="flex items-center gap-1 text-sm font-sans text-primary hover:underline">
                    <Calendar size={14} /> Choose a Time Slot
                  </button>
                ) : (
                  <button onClick={() => openDetail(c)} className="flex items-center gap-1 text-sm font-sans text-primary hover:underline">
                    <Eye size={14} /> View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Select Slot Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {selected.status === "assigned" || selected.status === "reschedule_requested" ? "Choose a Time Slot" : "Consultation Details"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="text-sm font-sans space-y-1">
                  <p><span className="text-muted-foreground">Client:</span> <strong>{selected.client_name}</strong></p>
                  <p><span className="text-muted-foreground">Email:</span> {selected.email}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {selected.phone}</p>
                  <p><span className="text-muted-foreground">Timezone:</span> {selected.timezone || "Not specified"}</p>
                  <p><span className="text-muted-foreground">Service:</span> {selected.service_interest || "—"}</p>
                  {selected.description && <p><span className="text-muted-foreground">Description:</span> {selected.description}</p>}
                </div>

                {(selected.status === "assigned" || selected.status === "reschedule_requested") && selected.proposed_slots?.length > 0 && (
                  <>
                    <div>
                      <Label className="font-sans text-xs mb-2 block">Client's Available Slots — Pick one</Label>
                      <div className="space-y-2">
                        {selected.proposed_slots.map((slot: any, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedSlotIdx(i)}
                            className={`w-full text-left p-3 rounded-lg border text-sm font-sans transition-colors flex items-center gap-2 ${
                              selectedSlotIdx === i ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border hover:bg-muted/50"
                            }`}
                          >
                            {selectedSlotIdx === i ? <Check size={16} className="text-primary shrink-0" /> : <Calendar size={14} className="shrink-0 text-muted-foreground" />}
                            <span>{slot.date} at {slot.time}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="font-sans text-xs">Note to client (optional)</Label>
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. Please prepare your CBCT scans before the call" />
                    </div>
                    <button
                      onClick={submitSelection}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg text-sm font-sans font-medium"
                    >
                      <Send size={14} /> Submit Selection to Admin
                    </button>
                  </>
                )}

                {selected.status === "time_proposed" && selected.confirmed_slot && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm font-sans text-indigo-800">
                    <Calendar size={14} className="inline mr-1" />
                    Your selection: {selected.confirmed_slot.date} at {selected.confirmed_slot.time} — Awaiting admin approval
                  </div>
                )}

                {selected.status === "confirmed" && selected.confirmed_slot && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm font-sans text-emerald-800">
                    <Check size={14} className="inline mr-1" />
                    Confirmed: {selected.confirmed_slot.date} at {selected.confirmed_slot.time}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DesignerLayout>
  );
};

export default DesignerConsultations;
