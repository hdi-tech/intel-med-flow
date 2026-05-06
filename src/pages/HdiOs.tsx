import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, ArrowRight } from "lucide-react";

const HERO_BG = "#0D1B2E";
const TEAL = "#1D9E75";

const beforeAfter = [
  {
    title: "Orders via WhatsApp",
    before: "Cases arrive informally, without structure, attachments get lost, follow-ups are manual.",
    after: "Structured case intake portal",
  },
  {
    title: "Status tracked in spreadsheets",
    before: "No real-time visibility. Clients call to chase updates. Errors are common.",
    after: "Live status dashboard for clients",
  },
  {
    title: "Reports emailed manually",
    before: "Radiologists email PDFs directly. No audit trail, no delivery confirmation, no archive.",
    after: "Automated report delivery with records",
  },
  {
    title: "Invoicing done separately",
    before: "Billing is disconnected from case flow, causing delays and reconciliation errors.",
    after: "Per-case invoicing built into the workflow",
  },
];

const features = [
  {
    title: "Branded client portal",
    desc: "Your referring dentists, clinics, and partners access a secure, white-labelled portal to submit cases, upload files, and track every order in real time.",
    tier: "Core",
    tone: "teal" as const,
  },
  {
    title: "Case intake & management",
    desc: "Structured intake forms per service type, automatic case numbering, file management, and multi-status workflow tracking from submission through delivery.",
    tier: "Core",
    tone: "teal" as const,
  },
  {
    title: "Team assignment & workload",
    desc: "Assign cases to technicians, radiologists, or specialists. Set turnaround targets, monitor workload, and resolve bottlenecks before they become delays.",
    tier: "Core",
    tone: "teal" as const,
  },
  {
    title: "Automated notifications",
    desc: "Every case milestone triggers a branded email — submission confirmed, assigned, in progress, completed, delivered. No manual chasing.",
    tier: "Core",
    tone: "teal" as const,
  },
  {
    title: "Invoicing & payment",
    desc: "Per-case pricing engine, automatic invoice generation, online and bank transfer payment options, and full financial reconciliation dashboard.",
    tier: "Premium",
    tone: "blue" as const,
  },
  {
    title: "Analytics & reporting",
    desc: "Case volume trends, turnaround performance, revenue per service line, and client retention metrics — the data layer your facility has been missing.",
    tier: "Premium",
    tone: "blue" as const,
  },
  {
    title: "Messaging & consultation",
    desc: "Built-in case-level messaging between your team and referring clients. Optional specialist consultation scheduling for complex cases.",
    tier: "Premium",
    tone: "blue" as const,
  },
  {
    title: "Custom service catalogue",
    desc: "Your full service menu — with pricing, turnaround times, required input files, and clinical notes — configured exactly as your facility operates.",
    tier: "Core",
    tone: "teal" as const,
  },
];

const audiences = [
  {
    title: "Dental laboratories",
    items: [
      "Crown and bridge order management",
      "Full-arch and implant prosthetics",
      "Technician assignment and QC",
      "Referring clinic portal access",
      "Material and case cost tracking",
    ],
  },
  {
    title: "Radiology centers",
    items: [
      "CBCT, OPG, and medical imaging",
      "Radiologist assignment per case",
      "Structured report templates",
      "Secure report delivery portal",
      "Full diagnostic audit trail",
    ],
  },
  {
    title: "Specialist clinics",
    items: [
      "Referral intake and management",
      "Design request coordination",
      "Inter-clinic case communication",
      "Appointment and follow-up tracking",
      "Clinical outcome documentation",
    ],
  },
  {
    title: "Multi-branch groups",
    items: [
      "Centralised case dashboard",
      "Branch-level performance visibility",
      "Unified client and partner directory",
      "Group-level financial reporting",
      "Role-based access per location",
    ],
  },
];

const steps = [
  { week: "Week 1", title: "Discovery", desc: "We map your workflow, service catalogue, team structure, and integration requirements." },
  { week: "Week 2", title: "Configuration", desc: "Portal is configured to your services, pricing, roles, and brand identity." },
  { week: "Week 3", title: "Onboarding", desc: "Team training and end-to-end test cases processed before go-live." },
  { week: "Week 4", title: "Go-live", desc: "Platform live. HDI support on standby for your first 30 days of full operations." },
];

const facilityTypes = [
  "Dental laboratory",
  "Radiology center",
  "Specialist clinic",
  "Multi-branch dental group",
  "Other healthcare provider",
];

const countries = [
  "UAE",
  "Saudi Arabia",
  "United Kingdom",
  "Australia",
  "Egypt",
  "Other",
];

const HdiOs = () => {
  const [form, setForm] = useState({
    full_name: "",
    organisation_name: "",
    email: "",
    phone: "",
    facility_type: "",
    country: "",
    workflow_challenge: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScroll = () => {
    document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFeatures = () => {
    document.getElementById("features-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.full_name || !form.organisation_name || !form.email || !form.phone || !form.facility_type || !form.country) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    const payload = {
      full_name: form.full_name.trim(),
      organisation_name: form.organisation_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      facility_type: form.facility_type,
      country: form.country,
      workflow_challenge: form.workflow_challenge.trim() || null,
    };
    const { error: insertError } = await supabase.from("hdi_os_enquiries").insert(payload);
    setSubmitting(false);

    if (insertError) {
      setError("We couldn't submit your enquiry. Please try again or email info@hdi-tech.com.");
      return;
    }

    // Notify admin (non-blocking)
    supabase.functions.invoke("send-email", {
      body: {
        template: "hdi-os-enquiry",
        to: "info@hdi-tech.com",
        data: { ...payload, created_at: new Date().toISOString() },
      },
    }).catch((err) => console.error("notify-os-enquiry failed:", err));

    setSubmitted(true);
  };

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "HDI OS — Healthcare Operations Platform | HDI";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <>
      {/* HERO */}
      <section style={{ backgroundColor: HERO_BG }} className="text-white">
        <div className="container mx-auto px-6 py-20 md:py-28 max-w-6xl">
          <Badge
            variant="outline"
            className="mb-6 border-white/20 text-white/80 bg-white/5"
          >
            Healthcare Software Solutions
          </Badge>
          <h1 className="text-3xl md:text-5xl font-medium text-white tracking-tight max-w-4xl leading-tight">
            The operational platform built for healthcare providers.
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/70 max-w-3xl leading-relaxed">
            HDI OS delivers purpose-built portals and workflow management systems for dental laboratories,
            radiology centers, and specialist clinics. Replace fragmented, manual operations with a single
            intelligent platform — configured for your facility, live within 30 days.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              onClick={handleScroll}
              size="lg"
              style={{ backgroundColor: TEAL }}
              className="text-white hover:opacity-90"
            >
              Build my system <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              onClick={scrollToFeatures}
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              See what's included
            </Button>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-background py-20 md:py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: TEAL }}>
              The problem
            </p>
            <h2 className="text-2xl md:text-4xl font-medium text-foreground tracking-tight">
              Healthcare facilities run on disconnected tools
            </h2>
            <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed">
              Most dental labs and radiology centers manage critical clinical operations through WhatsApp groups,
              paper prescription forms, and spreadsheets. HDI OS closes that gap.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {beforeAfter.map((item) => (
              <Card key={item.title} className="border bg-card flex flex-col">
                <CardContent className="p-6 flex flex-col gap-4 flex-1">
                  <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200 self-start">
                    Before
                  </Badge>
                  <h3 className="font-medium text-foreground text-base">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{item.before}</p>
                  <div className="pt-4 border-t">
                    <Badge
                      style={{ backgroundColor: TEAL }}
                      className="text-white hover:opacity-90 mb-2"
                    >
                      After
                    </Badge>
                    <p className="text-sm font-medium text-foreground mt-2">{item.after}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features-section" className="bg-muted/30 py-20 md:py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: TEAL }}>
              Platform features
            </p>
            <h2 className="text-2xl md:text-4xl font-medium text-foreground tracking-tight">
              One system. Every function your operation needs.
            </h2>
            <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed">
              HDI OS is configured to your service lines, team structure, and pricing — not a generic template
              you adapt to.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <Card key={f.title} className="border bg-card flex flex-col">
                <CardContent className="p-6 flex flex-col gap-3 flex-1">
                  <Badge
                    style={f.tone === "teal" ? { backgroundColor: TEAL } : { backgroundColor: "#2563eb" }}
                    className="text-white hover:opacity-90 self-start"
                  >
                    {f.tier}
                  </Badge>
                  <h3 className="font-medium text-foreground text-base mt-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCES */}
      <section className="bg-background py-20 md:py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: TEAL }}>
              Who it's built for
            </p>
            <h2 className="text-2xl md:text-4xl font-medium text-foreground tracking-tight">
              Four facility types. One platform.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {audiences.map((a) => (
              <Card
                key={a.title}
                style={{ backgroundColor: HERO_BG }}
                className="border-0 text-white"
              >
                <CardContent className="p-6">
                  <h3 className="font-medium text-white text-lg mb-4">{a.title}</h3>
                  <ul className="space-y-2.5">
                    {a.items.map((item) => (
                      <li key={item} className="flex gap-2 text-sm text-white/75">
                        <CheckCircle2
                          className="h-4 w-4 mt-0.5 flex-shrink-0"
                          style={{ color: TEAL }}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* PROVEN */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div
            className="rounded-2xl p-8 md:p-12 border-2"
            style={{
              borderColor: TEAL,
              backgroundColor: "rgba(29, 158, 117, 0.06)",
            }}
          >
            <h2 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight">
              Proven infrastructure — not a prototype
            </h2>
            <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed">
              HDI OS is not a concept built for sale. It is the operational backbone that powers HDI's own clinical
              design network, tested across real case volume, real payment flows, and real multi-role teams. What you
              receive is a production-grade platform — configured and deployed for your specific operation.
              Implementation is measured in days, not months.
            </p>
          </div>
        </div>
      </section>

      {/* IMPLEMENTATION */}
      <section className="bg-background py-20 md:py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ color: TEAL }}>
              Implementation
            </p>
            <h2 className="text-2xl md:text-4xl font-medium text-foreground tracking-tight">
              From first call to go-live in 30 days
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <Card key={s.week} className="border bg-card">
                <CardContent className="p-6">
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: TEAL }}
                  >
                    {s.week}
                  </div>
                  <h3 className="font-medium text-foreground text-lg mb-3">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact-section"
        style={{ backgroundColor: HERO_BG }}
        className="py-20 md:py-24"
      >
        <div className="container mx-auto px-6 max-w-3xl">
          <Card className="bg-white border shadow-lg">
            <CardContent className="p-8 md:p-10">
              {!submitted ? (
                <>
                  <h2 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight">
                    Build your operational system
                  </h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    Every HDI OS deployment is scoped and configured for the facility it serves. Tell us about your
                    operation and an HDI consultant will design the right solution for you.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full name *</Label>
                        <Input
                          id="full_name"
                          value={form.full_name}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                          required
                          maxLength={120}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="organisation_name">Organisation name *</Label>
                        <Input
                          id="organisation_name"
                          value={form.organisation_name}
                          onChange={(e) => setForm({ ...form, organisation_name: e.target.value })}
                          required
                          maxLength={150}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                          maxLength={255}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone / WhatsApp *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          required
                          maxLength={40}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Facility type *</Label>
                        <Select
                          value={form.facility_type}
                          onValueChange={(v) => setForm({ ...form, facility_type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select facility type" />
                          </SelectTrigger>
                          <SelectContent>
                            {facilityTypes.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Country *</Label>
                        <Select
                          value={form.country}
                          onValueChange={(v) => setForm({ ...form, country: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workflow_challenge">
                        Describe your current workflow challenge (optional)
                      </Label>
                      <Textarea
                        id="workflow_challenge"
                        rows={5}
                        maxLength={2000}
                        value={form.workflow_challenge}
                        onChange={(e) => setForm({ ...form, workflow_challenge: e.target.value })}
                        placeholder="e.g. We manage 80 cases per month via WhatsApp and need a proper system for case tracking, client communication, and invoicing..."
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      An HDI consultant will respond within 48 hours with a scoping proposal. Your information is kept
                      strictly confidential.
                    </p>

                    {error && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      style={{ backgroundColor: TEAL }}
                      className="w-full md:w-auto text-white hover:opacity-90"
                    >
                      {submitting ? "Submitting..." : "Submit enquiry"}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="py-8 text-center">
                  <CheckCircle2
                    className="h-12 w-12 mx-auto mb-4"
                    style={{ color: TEAL }}
                  />
                  <h2 className="text-xl md:text-2xl font-medium text-foreground">
                    Enquiry received
                  </h2>
                  <p className="mt-3 text-muted-foreground max-w-lg mx-auto leading-relaxed">
                    An HDI consultant will review your requirements and contact you within 48 hours with a tailored
                    scoping proposal.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};

export default HdiOs;
