import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import ConstellationSphere from "@/components/ConstellationSphere";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail, ADMIN_EMAIL } from "@/lib/emailHelpers";

const subjects = ["General Enquiry", "Technical Support", "Partnerships", "Education", "Other"];

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);

    const payload = {
      full_name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      subject: form.subject,
      message: form.message.trim(),
    };

    const { error: insertError } = await supabase.from("contact_submissions").insert(payload);

    if (insertError) {
      setLoading(false);
      setError("We couldn't send your message. Please try again or email info@hdi-tech.com directly.");
      return;
    }

    try {
      await sendEmail("contact-form", ADMIN_EMAIL, {
        ...payload,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Contact admin notification failed:", err);
    }

    setLoading(false);
    toast.success("Message sent — we'll reply within 24 hours.");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div style={{ backgroundColor: "#0D1B2E" }} className="min-h-screen">
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            {/* Left — info */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="mb-10 opacity-15">
                <ConstellationSphere size={180} opacity={1} />
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-light text-hdi-off-white mb-8">
                Get in touch
              </h1>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#5DCAA5" }} />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider mb-1" style={{ color: "#7AAECC" }}>Email</p>
                    <a href="mailto:info@hdi-tech.com" className="font-sans text-sm text-hdi-off-white hover:underline">
                      info@hdi-tech.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-0.5 flex-shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#5DCAA5"/>
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke="#5DCAA5" strokeWidth="1.5" fill="none"/>
                  </svg>
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider mb-1" style={{ color: "#7AAECC" }}>WhatsApp</p>
                    <p className="font-sans text-sm" style={{ color: "rgba(240,242,245,0.5)" }}>Coming soon</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#5DCAA5" }} />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider mb-1" style={{ color: "#7AAECC" }}>Location</p>
                    <p className="font-sans text-sm text-hdi-off-white">Dubai, UAE</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="mt-0.5 flex-shrink-0" style={{ color: "#5DCAA5" }} />
                  <div>
                    <p className="font-sans text-xs uppercase tracking-wider mb-1" style={{ color: "#7AAECC" }}>Hours</p>
                    <p className="font-sans text-sm text-hdi-off-white">Sunday–Thursday, 9:00–18:00 GST</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — form */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <form onSubmit={handleSubmit} className="rounded-xl p-6 md:p-8 space-y-5" style={{ backgroundColor: "rgba(22,46,69,0.5)", border: "1px solid rgba(122,174,204,0.12)" }}>
                <div>
                  <Label className="font-sans text-xs text-hdi-off-white mb-1.5 block">Full Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Dr. Jane Smith"
                    className="bg-hdi-dark/50 border-hdi-border/10 text-hdi-off-white placeholder:text-hdi-muted-text/40 font-sans text-sm"
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs text-hdi-off-white mb-1.5 block">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@clinic.com"
                    className="bg-hdi-dark/50 border-hdi-border/10 text-hdi-off-white placeholder:text-hdi-muted-text/40 font-sans text-sm"
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs text-hdi-off-white mb-1.5 block">Phone <span className="text-hdi-muted-text/50">(optional)</span></Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+971 50 123 4567"
                    className="bg-hdi-dark/50 border-hdi-border/10 text-hdi-off-white placeholder:text-hdi-muted-text/40 font-sans text-sm"
                  />
                </div>
                <div>
                  <Label className="font-sans text-xs text-hdi-off-white mb-1.5 block">Subject</Label>
                  <Select value={form.subject} onValueChange={(v) => setForm({ ...form, subject: v })}>
                    <SelectTrigger className="bg-hdi-dark/50 border-hdi-border/10 text-hdi-off-white font-sans text-sm">
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-sans text-xs text-hdi-off-white mb-1.5 block">Message</Label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    className="bg-hdi-dark/50 border-hdi-border/10 text-hdi-off-white placeholder:text-hdi-muted-text/40 font-sans text-sm resize-none"
                  />
                </div>
                {error && (
                  <p className="text-sm font-sans" style={{ color: "#ff8a8a" }}>{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full font-sans font-medium text-sm py-3"
                  style={{ backgroundColor: "#1D9E75", color: "#FFFFFF" }}
                >
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
