import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  GraduationCap,
  PenTool,
  Package,
  LifeBuoy,
  TrendingUp,
  CheckCircle2,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const TEAL = "#1D9E75";
const NAVY = "#0D1B2E";

const stats = [
  { value: "2–3", label: "Days to deliver per case vs weeks industry average" },
  { value: "AED 0", label: "Upfront cost to the clinic — HDI funds everything" },
  { value: "48", label: "Cases per year — the only commitment required" },
  { value: "5 yrs", label: "Exclusive partnership with full HDI support" },
];

const features = [
  {
    icon: Wrench,
    title: "Full lab setup — at zero cost",
    desc: "HDI installs a complete aligner production line inside your clinic. 3D printer, thermoforming unit, curing station, polishing tools, and all ancillary equipment — commissioned and ready to use.",
    badge: "Funded by HDI",
    badgeTone: "teal" as const,
  },
  {
    icon: GraduationCap,
    title: "On-site clinical training",
    desc: "Hands-on training for your dentists and clinical staff covering the full production protocol — from digital design to finished aligner fabrication — delivered by HDI specialists at your clinic.",
    badge: "Included",
    badgeTone: "teal" as const,
  },
  {
    icon: PenTool,
    title: "Specialist aligner design",
    desc: "Every case is digitally planned and designed by a licensed orthodontist via HDI Studio. Files are delivered directly to your production workflow, ready for printing.",
    badge: "Via HDI Portal",
    badgeTone: "teal" as const,
  },
  {
    icon: Package,
    title: "Premium aligner materials",
    desc: "Clinical-grade aligner sheets and printing resin, supplied exclusively by HDI on a committed annual volume. No procurement complexity — one supplier, one contract, guaranteed availability.",
    badge: "Exclusive supply",
    badgeTone: "teal" as const,
  },
  {
    icon: LifeBuoy,
    title: "5-year partnership support",
    desc: "Dedicated after-sales and technical support for the full duration of the agreement — equipment, materials, and design workflow covered at every stage.",
    badge: "Long-term",
    badgeTone: "teal" as const,
  },
  {
    icon: TrendingUp,
    title: "Growth pathway access",
    desc: "As your in-house capability grows, HDI expands your access — surgical guide production, temporary restorations, premium materials, and advanced equipment — all through the same partnership.",
    badge: "Upsell pathway",
    badgeTone: "amber" as const,
  },
];

const hdiProvides = [
  "Full aligner lab equipment — installed",
  "Clinical and technical training",
  "Specialist orthodontic case design",
  "Aligner sheets and printing resin supply",
  "5-year technical and after-sales support",
  "One-month trial before commitment",
];

const clinicCommits = [
  "Minimum 48 aligner cases per year",
  "Exclusive material sourcing through HDI",
  "5-year partnership agreement",
  "Case designs ordered via HDI Portal",
  "Resin and aligner sheets via HDI supply",
];

const steps = [
  { n: "01", title: "Application", desc: "Complete the HDI Align join form. Our team reviews your clinic profile and case volume." },
  { n: "02", title: "Clinic assessment", desc: "An HDI representative visits your clinic to confirm space, workflow readiness, and fit." },
  { n: "03", title: "Lab installation", desc: "HDI installs the full production line and commissions all equipment at zero cost to you." },
  { n: "04", title: "Team training", desc: "Hands-on training delivered on-site until your team is fully independent and producing." },
  { n: "05", title: "Trial month", desc: "One full month to validate the workflow and confirm operational readiness before signing." },
  { n: "06", title: "Agreement signed", desc: "5-year exclusive partnership begins. HDI remains your full-service aligner partner." },
];

const applicationSchema = z.object({
  full_name: z.string().trim().min(1, "Full name is required").max(100),
  clinic_name: z.string().trim().min(1, "Clinic name is required").max(150),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(5, "Phone is required").max(30),
  country: z.string().min(1, "Country is required"),
  monthly_cases: z.string().min(1, "Please select case volume"),
  notes: z.string().max(1000).optional(),
});

const HdiAlign = () => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    clinic_name: "",
    email: "",
    phone: "",
    country: "",
    monthly_cases: "",
    notes: "",
  });

  const scrollToJoin = () => {
    document.getElementById("join-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToHow = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = applicationSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Please check the form");
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase
      .from("hdi_align_applications")
      .insert({
        full_name: parsed.data.full_name,
        clinic_name: parsed.data.clinic_name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        country: parsed.data.country,
        monthly_cases: parsed.data.monthly_cases,
        notes: parsed.data.notes || null,
      });

    if (insertError) {
      setSubmitting(false);
      setError("Something went wrong. Please try again or contact us directly.");
      return;
    }

    // Notify admin (non-blocking — don't fail the submission if email fails)
    try {
      await supabase.functions.invoke("send-email", {
        body: {
          template: "hdi-align-application",
          to: "info@hdi-tech.com",
          data: {
            full_name: parsed.data.full_name,
            clinic_name: parsed.data.clinic_name,
            email: parsed.data.email,
            phone: parsed.data.phone,
            country: parsed.data.country,
            monthly_cases: parsed.data.monthly_cases,
            notes: parsed.data.notes || "",
            created_at: new Date().toISOString(),
          },
        },
      });
    } catch (e) {
      console.error("Failed to send admin notification:", e);
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="font-sans bg-white text-slate-900">
      {/* HERO */}
      <section className="text-white" style={{ backgroundColor: NAVY }}>
        <div className="container mx-auto px-4 lg:px-8 py-20 lg:py-28 max-w-5xl text-center">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-wide border mb-6"
            style={{ borderColor: `${TEAL}66`, color: TEAL, backgroundColor: `${TEAL}1A` }}
          >
            In-Clinic Aligner Production · GCC
          </span>
          <p className="italic text-lg font-medium mb-4" style={{ color: TEAL }}>
            Your lab. Our protocol. Their smile.
          </p>
          <h1 className="text-3xl md:text-5xl font-medium text-white mb-6 leading-tight">
            The complete in-house aligner programme for GCC clinics.
          </h1>
          <p className="text-sm md:text-base text-white/60 max-w-3xl mx-auto mb-10">
            HDI Align equips your clinic with a full aligner production lab — at zero cost. We install, we train, we design every case. You produce in days, not weeks, and deliver aligners under your own brand.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={scrollToJoin}
              className="text-white font-medium px-8 py-6 text-base"
              style={{ backgroundColor: TEAL }}
            >
              Join HDI Align
            </Button>
            <Button
              onClick={scrollToHow}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent px-8 py-6 text-base"
            >
              How the programme works
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-xl p-6 border text-left"
                style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <div className="text-3xl md:text-4xl font-medium mb-2" style={{ color: TEAL }}>
                  {s.value}
                </div>
                <div className="text-xs text-white/60 leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What HDI Align provides */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="text-center mb-14">
            <p className="uppercase text-xs tracking-widest font-medium mb-3" style={{ color: TEAL }}>
              What HDI Align provides
            </p>
            <h2 className="text-3xl md:text-4xl font-medium text-slate-900 mb-4">
              Everything you need. Nothing you have to buy.
            </h2>
            <p className="text-slate-600 max-w-3xl mx-auto">
              HDI Align is a complete end-to-end programme. We fund and install the production infrastructure, train your team, and remain your partner across every case you produce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="bg-white border border-slate-200 p-6 rounded-xl hover:shadow-lg transition-shadow">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${TEAL}1A` }}
                  >
                    <Icon size={22} style={{ color: TEAL }} />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{f.desc}</p>
                  {f.badgeTone === "teal" ? (
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${TEAL}1A`, color: TEAL }}
                    >
                      {f.badge}
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      {f.badge}
                    </span>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Partnership model */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <p className="uppercase text-xs tracking-widest font-medium mb-3" style={{ color: TEAL }}>
              Partnership model
            </p>
            <h2 className="text-3xl md:text-4xl font-medium text-slate-900">
              The HDI Align partnership model
            </h2>
          </div>

          <div
            className="rounded-2xl p-8 md:p-12 border-2"
            style={{ borderColor: `${TEAL}40`, backgroundColor: `${TEAL}08` }}
          >
            <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-6 items-start">
              <div>
                <h3 className="text-xl font-medium text-slate-900 mb-5">HDI provides</h3>
                <ul className="space-y-3">
                  {hdiProvides.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <CheckCircle2 size={18} style={{ color: TEAL }} className="flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hidden md:flex items-center justify-center pt-12">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: TEAL }}
                >
                  <ArrowLeftRight size={20} className="text-white" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-medium text-slate-900 mb-5">Clinic commits to</h3>
                <ul className="space-y-3">
                  {clinicCommits.map((item, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <CheckCircle2 size={18} style={{ color: TEAL }} className="flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="text-center mb-14">
            <p className="uppercase text-xs tracking-widest font-medium mb-3" style={{ color: TEAL }}>
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-medium text-slate-900">
              From application to production
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {steps.map((s) => (
              <div key={s.n} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="text-xs font-medium mb-3" style={{ color: TEAL }}>
                  Step {s.n}
                </div>
                <h3 className="text-base font-medium text-slate-900 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Form */}
      <section id="join-section" className="py-20 lg:py-28 bg-slate-50">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <Card className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10">
            {submitted ? (
              <div className="text-center py-10">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: `${TEAL}1A` }}
                >
                  <CheckCircle2 size={28} style={{ color: TEAL }} />
                </div>
                <h3 className="text-2xl font-medium text-slate-900 mb-3">Application received. Thank you.</h3>
                <p className="text-slate-600">
                  An HDI representative will contact you within 48 hours to discuss the next steps.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-medium text-slate-900 mb-3">Join HDI Align</h2>
                <p className="text-sm text-slate-600 mb-8">
                  Complete the form below and an HDI representative will contact you within 48 hours to discuss the programme and begin your clinic assessment. Availability is limited per quarter in each market.
                </p>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name" className="text-sm text-slate-700">Full name</Label>
                    <Input
                      id="full_name"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      placeholder="Dr. Ahmed Al-Mansouri"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clinic_name" className="text-sm text-slate-700">Clinic name</Label>
                    <Input
                      id="clinic_name"
                      required
                      value={form.clinic_name}
                      onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
                      placeholder="Al-Mansouri Orthodontics"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm text-slate-700">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm text-slate-700">Phone / WhatsApp</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+971 50 000 0000"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-slate-700">Country</Label>
                    <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UAE">UAE</SelectItem>
                        <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                        <SelectItem value="Qatar">Qatar</SelectItem>
                        <SelectItem value="Kuwait">Kuwait</SelectItem>
                        <SelectItem value="Bahrain">Bahrain</SelectItem>
                        <SelectItem value="Oman">Oman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-slate-700">Current monthly aligner cases</Label>
                    <Select value={form.monthly_cases} onValueChange={(v) => setForm({ ...form, monthly_cases: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select volume" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Less than 4">Less than 4</SelectItem>
                        <SelectItem value="4–8 cases">4–8 cases</SelectItem>
                        <SelectItem value="8–15 cases">8–15 cases</SelectItem>
                        <SelectItem value="More than 15">More than 15</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="notes" className="text-sm text-slate-700">
                      Anything you'd like us to know in advance <span className="text-slate-400">(optional)</span>
                    </Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      {error}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-500 mb-4">
                      By submitting, you agree to be contacted by an HDI representative. Your information is kept strictly confidential and will not be shared with third parties.
                    </p>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full md:w-auto text-white font-medium px-10 py-6"
                      style={{ backgroundColor: TEAL }}
                    >
                      {submitting ? "Submitting..." : "Submit application"}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
};

export default HdiAlign;
