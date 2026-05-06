import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail, ADMIN_EMAIL } from "@/lib/emailHelpers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, AlertCircle } from "lucide-react";

const specialties = [
  "General Dentist", "Orthodontist", "Oral Surgeon",
  "Prosthodontist", "Lab Technician", "Other",
];

const referralSources = ["Google", "Referral", "Social Media", "Conference", "Other"];

const timezones = [
  "UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00", "UTC-07:00",
  "UTC-06:00", "UTC-05:00", "UTC-04:00", "UTC-03:00", "UTC-02:00", "UTC-01:00",
  "UTC+00:00", "UTC+01:00", "UTC+02:00", "UTC+03:00", "UTC+03:30", "UTC+04:00",
  "UTC+04:30", "UTC+05:00", "UTC+05:30", "UTC+05:45", "UTC+06:00", "UTC+06:30",
  "UTC+07:00", "UTC+08:00", "UTC+09:00", "UTC+09:30", "UTC+10:00", "UTC+11:00", "UTC+12:00",
];

const countries = [
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Bahrain", "Kuwait", "Oman",
  "Egypt", "Jordan", "Lebanon", "Iraq", "India", "Pakistan",
  "United Kingdom", "United States", "Canada", "Australia", "Germany", "France", "Other",
];

const EMPTY_SLOTS = Array.from({ length: 5 }, () => ({ date: "", time: "" }));

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BookConsultationModal = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<{ id: string; code: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState(EMPTY_SLOTS.map((s) => ({ ...s })));
  const [slotError, setSlotError] = useState("");
  const [form, setForm] = useState({
    client_name: "", email: "", phone: "", country: "",
    specialty: "", service_interest: "", description: "",
    timezone: "", referral_source: "",
  });

  useEffect(() => {
    supabase.from("services").select("id, code, name").eq("is_active", true).eq("is_visible", true).order("code")
      .then(({ data }) => setServices(data || []));
  }, []);

  useEffect(() => {
    if (user && open) {
      supabase.from("profiles").select("full_name, country, specialty").eq("id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setForm((f) => ({
              ...f,
              client_name: data.full_name || f.client_name,
              email: user.email || f.email,
              country: data.country || f.country,
              specialty: data.specialty || f.specialty,
            }));
          }
        });
    }
  }, [user, open]);

  const validateSlots = (currentSlots: typeof slots): string => {
    const filled = currentSlots.filter((s) => s.date && s.time);
    if (filled.length < 5) return "Please fill all 5 time slots.";

    // Max 2 slots per day
    const dateCounts: Record<string, number> = {};
    for (const s of filled) {
      dateCounts[s.date] = (dateCounts[s.date] || 0) + 1;
      if (dateCounts[s.date] > 2) return `Maximum 2 slots allowed on the same day (${s.date}). Please spread across different days.`;
    }
    return "";
  };

  const updateSlot = (index: number, field: "date" | "time", value: string) => {
    const newSlots = slots.map((s, i) => i === index ? { ...s, [field]: value } : s);
    setSlots(newSlots);
    setSlotError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_name || !form.email || !form.phone || !form.country) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    const error = validateSlots(slots);
    if (error) {
      setSlotError(error);
      return;
    }

    setSubmitting(true);
    try {
      const serviceLabel = services.find((s) => s.code === form.service_interest);
      const validSlots = slots.filter((s) => s.date && s.time);

      const { error: dbError } = await supabase.from("consultations").insert({
        user_id: user?.id || null,
        client_name: form.client_name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        specialty: form.specialty || null,
        service_interest: serviceLabel ? `${serviceLabel.code} — ${serviceLabel.name}` : form.service_interest || null,
        description: form.description || null,
        timezone: form.timezone || null,
        referral_source: form.referral_source || null,
        proposed_slots: validSlots,
      } as any);

      if (dbError) throw dbError;

      sendEmail("consultation-booking-confirm", form.email, { clientName: form.client_name });
      sendEmail("consultation-new-alert", ADMIN_EMAIL, {
        clientName: form.client_name,
        email: form.email,
        country: form.country,
        service: serviceLabel ? `${serviceLabel.code} — ${serviceLabel.name}` : form.service_interest || "Not specified",
      });

      toast({ title: "Consultation request submitted!", description: "Our team will contact you within 24 hours." });
      onOpenChange(false);
      setForm({ client_name: "", email: "", phone: "", country: "", specialty: "", service_interest: "", description: "", timezone: "", referral_source: "" });
      setSlots(EMPTY_SLOTS.map((s) => ({ ...s })));
      setSlotError("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Book a Consultation</DialogTitle>
          <p className="text-sm text-muted-foreground font-sans">Fill in your details and our team will contact you within 24 hours.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-sans text-xs">Full Name *</Label>
              <Input value={form.client_name} onChange={(e) => update("client_name", e.target.value)} required />
            </div>
            <div>
              <Label className="font-sans text-xs">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-sans text-xs">Phone Number (with country code) *</Label>
              <Input placeholder="+971 50 123 4567" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
            </div>
            <div>
              <Label className="font-sans text-xs">Country *</Label>
              <Select value={form.country} onValueChange={(v) => update("country", v)}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-sans text-xs">Specialty / Role</Label>
              <Select value={form.specialty} onValueChange={(v) => update("specialty", v)}>
                <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-sans text-xs">Service of Interest</Label>
              <Select value={form.service_interest} onValueChange={(v) => update("service_interest", v)}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {services.map((s) => <SelectItem key={s.code} value={s.code}>{s.code} — {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="font-sans text-xs">Brief description of what you need</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} placeholder="Describe your case or requirements..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-sans text-xs">Preferred Time Zone</Label>
              <Select value={form.timezone} onValueChange={(v) => update("timezone", v)}>
                <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-sans text-xs">How did you hear about us?</Label>
              <Select value={form.referral_source} onValueChange={(v) => update("referral_source", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {referralSources.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 5 Available Time Slots */}
          <div>
            <Label className="font-sans text-xs flex items-center gap-1 mb-2">
              <Calendar size={14} /> Choose 5 Available Time Slots *
            </Label>
            <p className="text-xs text-muted-foreground mb-3 font-sans">
              Select 5 times you're available. Maximum 2 slots per day.
            </p>
            <div className="space-y-2">
              {slots.map((slot, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
                  <span className="text-xs font-sans text-muted-foreground w-5">{i + 1}.</span>
                  <Input type="date" value={slot.date} onChange={(e) => updateSlot(i, "date", e.target.value)} />
                  <Input type="time" value={slot.time} onChange={(e) => updateSlot(i, "time", e.target.value)} />
                </div>
              ))}
            </div>
            {slotError && (
              <div className="flex items-start gap-2 mt-2 text-sm text-destructive font-sans">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{slotError}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg font-medium font-sans text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#1D9E75" }}
          >
            {submitting ? "Submitting..." : "Submit Consultation Request"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookConsultationModal;
