import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ConstellationSphere from "@/components/ConstellationSphere";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, resolvePriceType, type PriceType } from "@/lib/servicePricing";

interface ServiceConfig {
  slug: string;
  title: string;
  accentWord: string;
  specialist: string;
  categoryKeyword: string;
  workflow: string[];
}

const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  "aligner-design": {
    slug: "aligner-design",
    title: "Aligner",
    accentWord: "Design",
    specialist: "Orthodontist",
    categoryKeyword: "aligner",
    workflow: [
      "Upload STL / CBCT files",
      "Orthodontist review",
      "Staging & movement design",
      "QC & approval",
      "File delivery (STL + report)",
    ],
  },
  "surgical-guide": {
    slug: "surgical-guide",
    title: "Surgical Guide",
    accentWord: "Design",
    specialist: "Implantologist",
    categoryKeyword: "surgical",
    workflow: [
      "Upload CBCT + intraoral scan",
      "Implantologist planning",
      "3D guide design",
      "Fit & safety verification",
      "STL delivery (print-ready)",
    ],
  },
  "crown-bridge": {
    slug: "crown-bridge",
    title: "Crown & Bridge",
    accentWord: "Design",
    specialist: "Qualified Dentist",
    categoryKeyword: "crown",
    workflow: [
      "Upload intraoral scan",
      "Shade & occlusion analysis",
      "CAD design & margination",
      "QC review",
      "STL / OBJ file delivery",
    ],
  },
  "cbct-reporting": {
    slug: "cbct-reporting",
    title: "CBCT",
    accentWord: "Reporting",
    specialist: "OMF Radiologist",
    categoryKeyword: "cbct",
    workflow: [
      "Upload DICOM files",
      "Radiologist assignment",
      "Measurements & analysis",
      "Bilingual report (AR + EN)",
      "PDF delivery",
    ],
  },
  "medical-radiology": {
    slug: "medical-radiology",
    title: "Medical Radiology",
    accentWord: "Reporting",
    specialist: "Board-certified Radiologist",
    categoryKeyword: "radiology",
    workflow: [
      "Upload imaging files",
      "Specialist assignment",
      "Clinical review & diagnosis",
      "Report writing",
      "PDF + optional consultation",
    ],
  },
};

interface ServiceRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_custom_quote: boolean;
  price_usd: number;
  price_type: PriceType | null;
  price_min_usd: number | null;
  price_max_usd: number | null;
  quote_note: string | null;
}

const ServiceDetailPage = ({ slug }: { slug: string }) => {
  const config = SERVICE_CONFIGS[slug];
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!config) return;
      // Find category id by keyword — ilike avoids exact-name fragility
      const { data: cats } = await supabase
        .from("categories")
        .select("id")
        .ilike("name", `%${config.categoryKeyword}%`)
        .limit(1);

      if (cats && cats.length > 0) {
        const { data: svcs } = await supabase
          .from("services")
          .select("id, code, name, description, is_custom_quote, price_usd, price_type, price_min_usd, price_max_usd, quote_note")
          .eq("category_id", cats[0].id)
          .eq("is_active", true)
          .order("code");
        if (svcs) setServices(svcs as unknown as ServiceRow[]);
      }
      setLoading(false);
    };
    load();
  }, [config]);

  if (!config) return <div className="py-20 text-center">Service not found</div>;

  const handleSubmit = (serviceId?: string) => {
    if (user) {
      navigate(serviceId ? `/dashboard/submit?service=${serviceId}` : "/dashboard/submit");
    } else {
      navigate("/register");
    }
  };

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden py-24 lg:py-32" style={{ backgroundColor: "#0D1B2E" }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ConstellationSphere size={700} opacity={0.08} />
        </div>
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-hdi-off-white leading-tight max-w-3xl mx-auto">
              {config.title}{" "}
              <em className="not-italic" style={{ fontStyle: "italic", color: "#5DCAA5" }}>
                {config.accentWord}
              </em>
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <span className="font-sans bg-accent/20 text-accent px-3 py-1 rounded-full font-medium" style={{ fontSize: "11px" }}>
                {config.specialist}
              </span>
              <span className="font-sans bg-primary/10 text-primary px-3 py-1 rounded-full font-medium" style={{ fontSize: "11px" }}>
                Clinical meeting available
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link
                to="/register"
                className="text-primary-foreground px-8 py-3 rounded-lg font-medium font-sans transition-colors"
                style={{ backgroundColor: "#1D9E75" }}
              >
                Get started
              </Link>
              <button
                onClick={() => handleSubmit()}
                className="border border-hdi-border/30 text-hdi-off-white hover:bg-hdi-navy/50 px-8 py-3 rounded-lg font-medium font-sans transition-colors"
              >
                Submit a case
              </button>
            </div>

            <p className="font-sans text-center mt-6" style={{ fontSize: "12px", color: "#7AAECC", opacity: 0.85 }}>
              First case in this category is free for new clients
            </p>
          </motion.div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="py-20 lg:py-28" style={{ backgroundColor: "#F5F8FC" }}>
        <div className="container mx-auto px-4 lg:px-8">
          <p className="font-sans uppercase mb-[10px]" style={{ fontSize: "9px", letterSpacing: "3px", color: "#1D9E75" }}>
            Step by Step
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-light mb-14" style={{ color: "#0D1B2E" }}>
            How it works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
            <div className="hidden md:block absolute top-[22px] left-[10%] right-[10%] h-px" style={{ backgroundColor: "#D0E4F0" }} />
            {config.workflow.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center relative"
              >
                <div
                  className="flex items-center justify-center mx-auto mb-4 relative z-10 rounded-full text-white"
                  style={{
                    width: "44px",
                    height: "44px",
                    backgroundColor: "#0D1B2E",
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: "13px",
                  }}
                >
                  {i + 1}
                </div>
                <p className="font-sans" style={{ fontSize: "12px", color: "#0D1B2E", lineHeight: 1.6 }}>
                  {step}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE TYPES / PRICING */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="container mx-auto px-4 lg:px-8">
          <p className="font-sans uppercase mb-[10px]" style={{ fontSize: "9px", letterSpacing: "3px", color: "#1D9E75" }}>
            Pricing
          </p>
          <h2 className="text-2xl md:text-3xl font-serif font-light mb-10" style={{ color: "#0D1B2E" }}>
            Select service type
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : services.length === 0 ? (
            <p className="font-sans text-sm" style={{ color: "#5A7A92" }}>No services available in this category yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((svc, i) => (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-lg p-6 transition-shadow hover:shadow-md"
                  style={{ border: "1px solid #D0E4F0", backgroundColor: "#FFFFFF" }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block font-sans text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(29,158,117,0.1)", color: "#1D9E75" }}>
                      {svc.code}
                    </span>
                    {resolvePriceType(svc) === "custom_quote" && (
                      <span className="inline-block font-sans text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}>
                        Custom Quote
                      </span>
                    )}
                    {resolvePriceType(svc) === "free" && (
                      <span className="inline-block font-sans text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(29,158,117,0.15)", color: "#1D9E75" }}>
                        Free
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-semibold mb-1" style={{ fontSize: "15px", color: "#0D1B2E" }}>
                    {svc.name}
                  </h3>
                  <p className="font-sans text-xs mb-4" style={{ color: "#5A7A92", lineHeight: 1.65 }}>
                    {svc.description || ""}
                  </p>

                  {/* Pricing */}
                  {resolvePriceType(svc) === "custom_quote" ? (
                    <div>
                      <span className="font-sans text-[11px]" style={{ color: "#8B5CF6" }}>
                        Get a quote after submission
                      </span>
                      {svc.quote_note && (
                        <p className="font-sans text-[10px] mt-1" style={{ color: "#7AAECC" }}>{svc.quote_note}</p>
                      )}
                    </div>
                  ) : !authLoading && user ? (
                    <span className="font-sans font-semibold" style={{ fontSize: "14px", color: "#0D1B2E" }}>
                      {formatPrice(svc)}
                    </span>
                  ) : (
                    <Link to="/login" className="font-sans text-[11px] hover:underline" style={{ color: "#8AACBF" }}>
                      Sign in to view pricing
                    </Link>
                  )}

                  <div className="mt-3">
                    {!authLoading && user ? (
                      <button
                        onClick={() => handleSubmit(svc.id)}
                        className="inline-flex items-center gap-1 font-sans text-xs font-medium transition-colors hover:opacity-80"
                        style={{ color: "#1D9E75" }}
                      >
                        Submit this service →
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        className="inline-flex items-center gap-1 font-sans text-xs font-medium transition-colors hover:opacity-80"
                        style={{ color: "#1D9E75" }}
                      >
                        Sign in to submit →
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CLINICAL CONSULTATION */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: "#F5F8FC" }}>
        <div className="container mx-auto px-4 lg:px-8">
          <div
            className="rounded-lg p-8"
            style={{
              border: "1.5px solid rgba(29,158,117,0.30)",
              backgroundColor: "#F2FBF8",
            }}
          >
            <h3 className="font-serif font-semibold mb-2" style={{ fontSize: "18px", color: "#0D1B2E" }}>
              Online clinical consultation available
            </h3>
            <p className="font-sans text-sm" style={{ color: "#5A7A92", lineHeight: 1.7 }}>
              Add a live video session with the assigned specialist to discuss your case plan before final delivery.
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="py-20 lg:py-28" style={{ backgroundColor: "#162E45" }}>
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-serif font-light text-hdi-off-white mb-4">
              Ready to submit your first case?
            </h2>
            <p className="font-sans text-sm mb-10" style={{ color: "#7AAECC" }}>
              Register free and get one complimentary trial case per service category.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="text-primary-foreground px-8 py-3 rounded-lg font-medium font-sans transition-colors"
                style={{ backgroundColor: "#1D9E75" }}
              >
                Get started
              </Link>
              <button
                onClick={() => handleSubmit()}
                className="border border-hdi-border/30 text-hdi-off-white hover:bg-hdi-navy/50 px-8 py-3 rounded-lg font-medium font-sans transition-colors"
              >
                Submit a case
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export { SERVICE_CONFIGS };
export default ServiceDetailPage;
