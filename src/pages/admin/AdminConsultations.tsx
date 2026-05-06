import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail, ADMIN_EMAIL } from "@/lib/emailHelpers";
import AdminLayout from "@/components/AdminLayout";
import { formatDate } from "@/lib/caseHelpers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Eye, X, Send, Check } from "lucide-react";

type ConsultationStatus = "pending_review" | "assigned" | "time_proposed" | "confirmed" | "completed" | "cancelled" | "reschedule_requested";

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
  referral_source: string | null;
  status: ConsultationStatus;
  assigned_designer_id: string | null;
  proposed_slots: any;
  confirmed_slot: any;
  admin_notes: string | null;
  designer_notes: string | null;
  reschedule_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface Designer {
  id: string;
  full_name: string | null;
}

const statusColors: Record<ConsultationStatus, string> = {
  pending_review: "bg-amber-100 text-amber-800",
  assigned: "bg-blue-100 text-blue-800",
  time_proposed: "bg-indigo-100 text-indigo-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  reschedule_requested: "bg-orange-100 text-orange-800",
};

const AdminConsultations = () => {
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const load = async () => {
    const { data } = await supabase.from("consultations").select("*").order("created_at", { ascending: false });
    setConsultations((data || []) as unknown as Consultation[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    supabase.from("user_roles").select("user_id").eq("role", "designer")
      .then(async ({ data: roles }) => {
        if (!roles?.length) return;
        const ids = roles.map((r) => r.user_id);
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        setDesigners((profiles || []) as Designer[]);
      });

    const channel = supabase
      .channel("admin-consultations")
      .on("postgres_changes", { event: "*", schema: "public", table: "consultations" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const assignDesigner = async (consultId: string, designerId: string) => {
    const { error } = await supabase.from("consultations").update({
      assigned_designer_id: designerId,
      status: "assigned" as any,
    } as any).eq("id", consultId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    const designer = designers.find((d) => d.id === designerId);
    const consult = consultations.find((c) => c.id === consultId);
    sendEmail("consultation-assigned", designerId, {
      designerName: designer?.full_name,
      clientName: consult?.client_name,
      service: consult?.service_interest,
    });
    toast({ title: "Designer assigned" });
    load();
  };

  const cancelConsultation = async (id: string) => {
    await supabase.from("consultations").update({ status: "cancelled" as any } as any).eq("id", id);
    toast({ title: "Consultation cancelled" });
    load();
    setSelected(null);
  };

  const saveNotes = async (id: string) => {
    await supabase.from("consultations").update({ admin_notes: adminNotes } as any).eq("id", id);
    toast({ title: "Notes saved" });
    load();
  };

  const confirmDesignerSelection = async (consult: Consultation) => {
    if (!consult.confirmed_slot) {
      toast({ title: "Designer hasn't selected a slot yet", variant: "destructive" });
      return;
    }

    await supabase.from("consultations").update({
      status: "confirmed" as any,
    } as any).eq("id", consult.id);

    const designer = designers.find((d) => d.id === consult.assigned_designer_id);
    sendEmail("consultation-confirmed", consult.email, {
      clientName: consult.client_name,
      designerName: designer?.full_name || "Your HDI Specialist",
      date: consult.confirmed_slot.date,
      time: consult.confirmed_slot.time,
      timezone: consult.timezone || "UTC+04:00",
    });
    toast({ title: "Meeting confirmed & client notified" });
    load();
    setSelected(null);
  };

  const openDetail = (c: Consultation) => {
    setSelected(c);
    setAdminNotes(c.admin_notes || "");
  };

  if (loading) return <AdminLayout><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-serif text-foreground mb-6">Consultation Requests</h1>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans">Name</TableHead>
                <TableHead className="font-sans">Email</TableHead>
                <TableHead className="font-sans">Country</TableHead>
                <TableHead className="font-sans">Service</TableHead>
                <TableHead className="font-sans">Status</TableHead>
                <TableHead className="font-sans">Submitted</TableHead>
                <TableHead className="font-sans"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultations.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10 font-sans">No consultation requests yet.</TableCell></TableRow>
              ) : consultations.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-sans font-medium">{c.client_name}</TableCell>
                  <TableCell className="font-sans text-sm text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="font-sans text-sm">{c.country}</TableCell>
                  <TableCell className="font-sans text-sm">{c.service_interest || "—"}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-sans font-medium px-2 py-1 rounded-full ${statusColors[c.status]}`}>
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="font-sans text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                  <TableCell>
                    <button onClick={() => openDetail(c)} className="text-primary hover:underline text-sm font-sans flex items-center gap-1">
                      <Eye size={14} /> View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Consultation Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4 text-sm font-sans">
                  <div><span className="text-muted-foreground">Name:</span> <strong>{selected.client_name}</strong></div>
                  <div><span className="text-muted-foreground">Email:</span> {selected.email}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {selected.phone}</div>
                  <div><span className="text-muted-foreground">Country:</span> {selected.country}</div>
                  <div><span className="text-muted-foreground">Specialty:</span> {selected.specialty || "—"}</div>
                  <div><span className="text-muted-foreground">Timezone:</span> {selected.timezone || "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Service:</span> {selected.service_interest || "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Description:</span><br/>{selected.description || "—"}</div>
                  <div><span className="text-muted-foreground">Referral:</span> {selected.referral_source || "—"}</div>
                  <div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[selected.status]}`}>
                      {selected.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {selected.reschedule_reason && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm font-sans">
                    <strong className="text-orange-800">Reschedule Request:</strong>
                    <p className="text-orange-700 mt-1">{selected.reschedule_reason}</p>
                  </div>
                )}

                {/* Client's proposed slots */}
                {selected.proposed_slots?.length > 0 && (
                  <div>
                    <Label className="font-sans text-xs mb-2 block">Client's Available Slots ({selected.proposed_slots.length})</Label>
                    <div className="space-y-1">
                      {selected.proposed_slots.map((slot: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border text-sm font-sans">
                          <Calendar size={14} className="text-muted-foreground" />
                          <span>{slot.date} at {slot.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assign Designer */}
                {["pending_review", "reschedule_requested"].includes(selected.status) && (
                  <div>
                    <Label className="font-sans text-xs">Assign Designer</Label>
                    <Select onValueChange={(v) => assignDesigner(selected.id, v)}>
                      <SelectTrigger><SelectValue placeholder="Select designer" /></SelectTrigger>
                      <SelectContent>
                        {designers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.full_name || d.id.slice(0, 8)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Designer's selection waiting for admin approval */}
                {selected.status === "time_proposed" && selected.confirmed_slot && (
                  <div>
                    <Label className="font-sans text-xs mb-2 block">Designer's Selected Slot</Label>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm font-sans text-indigo-800 mb-2">
                      <Calendar size={14} className="inline mr-1" />
                      {selected.confirmed_slot.date} at {selected.confirmed_slot.time}
                    </div>
                    {selected.designer_notes && (
                      <p className="text-xs text-muted-foreground font-sans italic mb-2">Designer note: {selected.designer_notes}</p>
                    )}
                    <button
                      onClick={() => confirmDesignerSelection(selected)}
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-lg text-sm font-sans font-medium"
                    >
                      <Send size={14} /> Approve & Send to Client
                    </button>
                  </div>
                )}

                {/* Confirmed slot */}
                {selected.status === "confirmed" && selected.confirmed_slot && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm font-sans">
                    <Check size={14} className="inline mr-1 text-emerald-600" />
                    <strong className="text-emerald-800">Confirmed:</strong> {selected.confirmed_slot.date} at {selected.confirmed_slot.time}
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <Label className="font-sans text-xs">Admin Notes</Label>
                  <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} />
                  <button onClick={() => saveNotes(selected.id)} className="mt-2 text-sm font-sans text-primary hover:underline">Save Notes</button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-border">
                  {selected.status !== "cancelled" && selected.status !== "completed" && (
                    <button onClick={() => cancelConsultation(selected.id)} className="flex items-center gap-1 text-sm font-sans text-red-600 hover:underline">
                      <X size={14} /> Cancel
                    </button>
                  )}
                  {selected.status === "confirmed" && (
                    <button
                      onClick={async () => {
                        await supabase.from("consultations").update({ status: "completed" as any } as any).eq("id", selected.id);
                        toast({ title: "Marked as completed" });
                        load(); setSelected(null);
                      }}
                      className="flex items-center gap-1 text-sm font-sans text-emerald-600 hover:underline"
                    >
                      <Check size={14} /> Mark Completed
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminConsultations;
