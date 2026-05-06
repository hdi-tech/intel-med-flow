import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ConstellationSphere from "@/components/ConstellationSphere";
import { DermatologyIcon } from "@/components/ServiceIcons";
import alignerIcon from "@/assets/aligner_icon.png";
import surgicalIcon from "@/assets/surgical_icon.png";
import crownIcon from "@/assets/crown_icon.png";
import cbctIcon from "@/assets/cbct_icon.png";
import medicalIcon from "@/assets/medical_icon.png";

const serviceCards = [
  {
    title: "Aligner Design",
    description: "Treatment planning and staged tooth movement design. STL files for in-house printing.",
    specialist: "Orthodontist",
    iconSrc: alignerIcon,
    href: "/services/aligner-design",
    accent: true,
  },
  {
    title: "Surgical Guide Design",
    description: "Implant planning from CBCT + intraoral scan data. STL guide for in-house printing.",
    specialist: "Implantologist",
    iconSrc: surgicalIcon,
    href: "/services/surgical-guide",
  },
  {
    title: "Crown & Bridge Design",
    description: "Full contour CAD restoration from intraoral scans. Crowns, bridges, veneers, inlays, onlays.",
    specialist: "Qualified Dentist",
    iconSrc: crownIcon,
    href: "/services/crown-bridge",
  },
  {
    title: "CBCT Reporting",
    description: "Full pathology review by oral & maxillofacial radiologists. Standard and premium reports.",
    specialist: "OMF Radiologist",
    iconSrc: cbctIcon,
    href: "/services/cbct-reporting",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Services = () => (
  <div>
    {/* Hero */}
    <section className="relative overflow-hidden py-24 lg:py-32" style={{ backgroundColor: "#0D1B2E" }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <ConstellationSphere size={700} opacity={0.08} />
      </div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block font-sans text-[9px] tracking-[3px] uppercase px-4 py-1.5 rounded-full border mb-8" style={{ color: "#5DCAA5", borderColor: "rgba(93,202,165,0.25)", backgroundColor: "rgba(22,46,69,0.6)" }}>
            What We Do
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-hdi-off-white leading-tight max-w-3xl mx-auto">
            Every service. A specialist behind it.
          </h1>
          <p className="font-sans text-sm mt-6 max-w-2xl mx-auto" style={{ color: "#7AAECC", lineHeight: 1.7 }}>
            From a single crown to a complex full-arch case — every HDI service is reviewed and delivered by a credentialled specialist.
          </p>
        </motion.div>
      </div>
    </section>

    {/* Dental Services */}
    <section style={{ backgroundColor: "#FFFFFF" }} className="py-20 lg:py-28">
      <div className="container mx-auto px-4 lg:px-8">
        <p className="font-sans uppercase mb-[10px]" style={{ fontSize: "9px", letterSpacing: "3px", color: "#1D9E75" }}>
          Dental Services — Active Now
        </p>
        <h2 className="text-3xl md:text-4xl font-serif font-light mb-10" style={{ color: "#0D1B2E" }}>
          Every case. A qualified specialist.
        </h2>

        {/* Global free trial banner — one per category, not per service */}
        <div
          className="inline-flex items-center gap-2 mb-8"
          style={{
            backgroundColor: "#E0F5EC",
            border: "1px solid #9FE1CB",
            borderRadius: "20px",
            padding: "6px 16px",
          }}
        >
          <svg viewBox="0 0 20 20" fill="none" className="flex-shrink-0" style={{ width: "14px", height: "14px" }}>
            <circle cx="10" cy="10" r="10" fill="#1D9E75"/>
            <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="font-sans" style={{ fontSize: "12px", fontWeight: 500, color: "#0F6E56" }}>
            ✦ Try one service from each category free — no commitment required
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {serviceCards.map((s, i) => (
            <motion.div key={s.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={fadeUp}>
              <Link
                to={s.href}
                className="relative block rounded-lg p-6 hover:shadow-lg transition-shadow group"
                style={{
                  border: s.accent ? "1px solid rgba(29,158,117,0.30)" : "1px solid #D0E4F0",
                  backgroundColor: s.accent ? "#F2FBF8" : "#FFFFFF",
                }}
              >
                <div className="mb-4 flex-shrink-0 flex items-center justify-center" style={{ width: "54px", height: "54px", border: s.accent ? "1px solid #9FE1CB" : "1px solid #D0E4F0", borderRadius: "8px", backgroundColor: s.accent ? "#EAF9F3" : "#F8FAFB" }}>
                  <img src={s.iconSrc} alt={s.title} style={{ width: "42px", height: "42px", objectFit: "contain" }} />
                </div>
                <h3 className="font-serif mb-1" style={{ fontSize: "15px", fontWeight: 600, color: "#0D1B2E" }}>{s.title}</h3>
                <p className="font-sans mb-3" style={{ fontSize: "12px", color: "#5A7A92", lineHeight: 1.68 }}>{s.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="font-sans bg-accent/20 text-accent px-2.5 py-0.5 rounded-full font-medium" style={{ fontSize: "11px" }}>{s.specialist}</span>
                  <span className="font-sans bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium" style={{ fontSize: "11px" }}>Clinical meeting available</span>
                </div>
                <span className="inline-block mt-3 font-sans text-xs font-medium" style={{ color: "#1D9E75" }}>View details →</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Healthcare section */}
        <p className="font-sans uppercase mt-16 mb-6" style={{ fontSize: "9px", letterSpacing: "3px", color: "#1D9E75" }}>
          Expanding Into Healthcare
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Link
              to="/services/medical-radiology"
              className="relative block rounded-lg p-6 hover:shadow-lg transition-shadow"
              style={{ border: "1px solid #D0E4F0", backgroundColor: "#FFFFFF" }}
            >
              <div className="mb-4 flex items-center justify-center" style={{ width: "54px", height: "54px", border: "1px solid #D0E4F0", borderRadius: "8px", backgroundColor: "#F8FAFB" }}>
                <img src={medicalIcon} alt="Medical Radiology" style={{ width: "42px", height: "42px", objectFit: "contain" }} />
              </div>
              <h3 className="font-serif mb-1" style={{ fontSize: "15px", fontWeight: 600, color: "#0D1B2E" }}>Medical Radiology Reporting</h3>
              <p className="font-sans mb-3" style={{ fontSize: "12px", color: "#5A7A92", lineHeight: 1.68 }}>Remote CT, MRI and X-ray interpretation by board-certified radiologists.</p>
              <div className="flex flex-wrap gap-2">
                <span className="font-sans bg-accent/20 text-accent px-2.5 py-0.5 rounded-full font-medium" style={{ fontSize: "11px" }}>Board-certified radiologist</span>
              </div>
              <span className="inline-block mt-3 font-sans text-xs font-medium" style={{ color: "#1D9E75" }}>View details →</span>
            </Link>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <Link
              to="/services/coming-soon"
              className="relative block rounded-lg p-6"
              style={{ border: "1.5px dashed #BFD4E4", backgroundColor: "#FAFBFC" }}
            >
              <div className="mb-3">
                <span className="font-sans font-semibold uppercase" style={{ fontSize: "8px", letterSpacing: "1.5px", backgroundColor: "#FEF0EC", color: "#712B13", padding: "3px 8px", borderRadius: "2px" }}>
                  Coming Soon
                </span>
              </div>
              <div className="mb-4 flex items-center justify-center" style={{ width: "54px", height: "54px", border: "1px solid #D0E4F0", borderRadius: "8px", backgroundColor: "#F8FAFB" }}>
                <div style={{ width: "38px", height: "38px" }}><DermatologyIcon /></div>
              </div>
              <h3 className="font-serif mb-1" style={{ fontSize: "15px", fontWeight: 600, color: "#8AACBF" }}>Dermatology Telediagnosis</h3>
              <p className="font-sans" style={{ fontSize: "12px", color: "#9ABACC", lineHeight: 1.68 }}>Remote dermatological assessment and diagnosis support — coming soon.</p>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Bottom CTA */}
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#162E45" }}>
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-serif font-light text-hdi-off-white mb-4">
            Ready to submit your first case?
          </h2>
            <p className="font-sans text-sm mb-10" style={{ color: "#7AAECC" }}>
              Register free and get one complimentary trial case per service category.
            </p>
          <Link to="/register" className="inline-block text-primary-foreground px-8 py-3 rounded-lg font-medium font-sans transition-colors" style={{ backgroundColor: "#1D9E75" }}>
            Create Free Account
          </Link>
        </motion.div>
      </div>
    </section>
  </div>
);

export default Services;
