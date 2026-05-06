import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBankSettings } from "@/hooks/useBankSettings";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, resolvePriceType, type PriceType } from "@/lib/servicePricing";

interface PricingService {
  id: string;
  code: string;
  name: string;
  price_usd: number;
  is_custom_quote: boolean;
  price_type: PriceType | null;
  price_min_usd: number | null;
  price_max_usd: number | null;
  quote_note: string | null;
  category_id: string | null;
}

interface PricingCategory {
  id: string;
  name: string;
  services: PricingService[];
  hasCustomQuote: boolean;
}

const Pricing = () => {
  const { user } = useAuth();
  const { bank } = useBankSettings();
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: cats }, { data: svcs }] = await Promise.all([
        supabase.from("categories").select("id, name, sort_order").eq("is_visible", true).order("sort_order"),
        supabase
          .from("services")
          .select("id, code, name, price_usd, is_custom_quote, price_type, price_min_usd, price_max_usd, quote_note, category_id")
          .eq("is_active", true)
          .eq("is_visible", true)
          .order("code"),
      ]);
      const services = (svcs || []) as unknown as PricingService[];
      const grouped: PricingCategory[] = (cats || []).map((c) => {
        const list = services.filter((s) => s.category_id === c.id);
        return {
          id: c.id,
          name: c.name,
          services: list,
          hasCustomQuote: list.some((s) => resolvePriceType(s) === "custom_quote"),
        };
      }).filter((c) => c.services.length > 0);
      setCategories(grouped);
      setLoading(false);
    };
    load();
  }, []);

  return (
  <div style={{ backgroundColor: "#0D1B2E" }} className="min-h-screen">
    {/* Header */}
    <section className="py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-block font-sans text-[9px] tracking-[3px] uppercase px-4 py-1.5 rounded-full border mb-8" style={{ color: "#5DCAA5", borderColor: "rgba(93,202,165,0.25)", backgroundColor: "rgba(22,46,69,0.6)" }}>
            Transparent Pricing
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-light text-hdi-off-white leading-tight max-w-2xl mx-auto">
            Pay per case. No subscriptions.
          </h1>
          <p className="font-sans text-sm mt-6" style={{ color: "#7AAECC" }}>
            Every case is priced individually. You only pay after you approve the design.
          </p>
        </motion.div>

        {/* Free trial banner */}
        <div className="inline-flex items-center gap-2 mt-10 px-5 py-2.5 rounded-full" style={{ backgroundColor: "rgba(29,158,117,0.12)", border: "1px solid rgba(93,202,165,0.25)" }}>
          <svg viewBox="0 0 20 20" fill="none" style={{ width: 14, height: 14 }} className="flex-shrink-0">
            <circle cx="10" cy="10" r="10" fill="#1D9E75" />
            <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-sans text-xs" style={{ color: "#5DCAA5" }}>
            New accounts receive 1 free trial case per service category — no credit card required
          </span>
        </div>
      </div>
    </section>

    {/* Pricing tables */}
    <section className="pb-16">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        {loading && (
          <div className="text-center py-10">
            <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#5DCAA5", borderTopColor: "transparent" }} />
          </div>
        )}
        {!loading && categories.length === 0 && (
          <p className="text-center font-sans text-sm py-10" style={{ color: "#7AAECC" }}>
            Pricing is being updated. Please check back soon.
          </p>
        )}
        {categories.map((cat) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <span className="font-sans text-[9px] tracking-[3px] uppercase block mb-2" style={{ color: "#1D9E75" }}>
              {cat.name.toUpperCase()}
            </span>
            <h2 className="text-xl font-serif font-light text-hdi-off-white mb-4">{cat.name}</h2>

            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid rgba(122,174,204,0.12)" }}>
              {/* Table header */}
              <div className="grid grid-cols-12 px-4 py-2.5 font-sans text-[10px] uppercase tracking-wider" style={{ backgroundColor: "rgba(22,46,69,0.6)", color: "#7AAECC" }}>
                <div className="col-span-2">Code</div>
                <div className="col-span-7">Service</div>
                <div className="col-span-3 text-right">Price (USD)</div>
              </div>

              {cat.services.map((svc, i) => (
                <div
                  key={svc.id}
                  className="grid grid-cols-12 px-4 py-3 items-center font-sans text-sm"
                  style={{
                    borderTop: "1px solid rgba(122,174,204,0.08)",
                    backgroundColor: i % 2 === 0 ? "rgba(13,27,46,0.5)" : "rgba(22,46,69,0.3)",
                  }}
                >
                  <div className="col-span-2">
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(29,158,117,0.12)", color: "#5DCAA5" }}>
                      {svc.code}
                    </span>
                  </div>
                  <div className="col-span-7 text-hdi-off-white text-xs">{svc.name}</div>
                  <div className="col-span-3 text-right">
                    {resolvePriceType(svc) === "custom_quote" ? (
                      <span className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
                        Custom Quote
                      </span>
                    ) : resolvePriceType(svc) === "free" ? (
                      <span className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(29,158,117,0.18)", color: "#5DCAA5" }}>
                        Free
                      </span>
                    ) : (
                      <span className="font-medium text-hdi-off-white text-sm">{formatPrice(svc)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom quote note */}
            {cat.hasCustomQuote && (
              <p className="font-sans text-[11px] mt-3" style={{ color: "#7AAECC", lineHeight: 1.6 }}>
                * Custom Quote services are priced based on case complexity. Submit your case and receive a personalised quote within 24 hours.
              </p>
            )}
          </motion.div>
        ))}

        {/* Rush note */}
        <div className="rounded-lg p-5 mb-12" style={{ backgroundColor: "rgba(22,46,69,0.5)", border: "1px solid rgba(122,174,204,0.1)" }}>
          <p className="font-sans text-xs" style={{ color: "#7AAECC", lineHeight: 1.65 }}>
            <strong className="text-hdi-off-white">Rush 24h delivery</strong> available on all services — +20% on standard price. Selected at case submission.
          </p>
        </div>

        {/* Payment methods */}
        <h3 className="font-serif text-xl text-hdi-off-white mb-6">Payment Methods</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg p-5" style={{ border: "1px solid rgba(122,174,204,0.12)", backgroundColor: "rgba(22,46,69,0.4)" }}>
            <CreditCard size={20} className="mb-3" style={{ color: "#5DCAA5" }} />
            <h4 className="font-sans text-sm font-semibold text-hdi-off-white mb-1">Credit Card</h4>
            <p className="font-sans text-xs" style={{ color: "#7AAECC" }}>Visa, Mastercard (via Stripe)</p>
          </div>
          <div className="rounded-lg p-5" style={{ border: "1px solid rgba(122,174,204,0.12)", backgroundColor: "rgba(22,46,69,0.4)" }}>
            <Building2 size={20} className="mb-3" style={{ color: "#5DCAA5" }} />
            <h4 className="font-sans text-sm font-semibold text-hdi-off-white mb-1">Bank Transfer</h4>
            {bank ? (
              <div className="space-y-1.5 mt-2">
                <p className="font-sans text-xs text-hdi-off-white">{bank.bank_name}</p>
                <p className="font-sans text-xs" style={{ color: "#7AAECC" }}>IBAN: {bank.iban}</p>
                <p className="font-sans text-xs" style={{ color: "#7AAECC" }}>Swift: {bank.swift_code}</p>
                <p className="font-sans text-xs" style={{ color: "#7AAECC" }}>Currency: {bank.currency}</p>
                <p className="font-sans text-[10px] mt-2" style={{ color: "#5DCAA5" }}>
                  Contact info@hdi-tech.com after transfer with your case reference.
                </p>
              </div>
            ) : (
              <p className="font-sans text-xs" style={{ color: "#7AAECC" }}>Contact info@hdi-tech.com</p>
            )}
          </div>
        </div>
        <p className="font-sans text-xs text-center mb-16" style={{ color: "#5A7A92" }}>
          Bundles and institutional pricing coming soon.
        </p>

        {/* CTA */}
        <div className="text-center pb-8">
          <Link
            to={user ? "/dashboard/submit" : "/register"}
            className="inline-block text-primary-foreground px-8 py-3 rounded-lg font-medium font-sans transition-colors"
            style={{ backgroundColor: "#1D9E75" }}
          >
            Submit a Case →
          </Link>
        </div>
      </div>
    </section>
  </div>
  );
};

export default Pricing;
