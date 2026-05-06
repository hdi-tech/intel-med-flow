import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ConstellationSphere from "../components/ConstellationSphere";
import BookConsultationModal from "@/components/BookConsultationModal";
import HdiLogo from "../components/HdiLogo";
import { DermatologyIcon } from "../components/ServiceIcons";
import alignerIcon from "@/assets/aligner_icon.png";
import surgicalIcon from "@/assets/surgical_icon.png";
import crownIcon from "@/assets/crown_icon.png";
import cbctIcon from "@/assets/cbct_icon.png";
import medicalIcon from "@/assets/medical_icon.png";

const services = [
  {
    title: "Aligner Design",
    description: "Treatment planning and staged tooth movement design. STL files for in-house printing. Full case or single arch.",
    specialist: "Orthodontist",
    iconSrc: alignerIcon,
    accent: true,
    href: "/services/aligner-design",
  },
  {
    title: "Surgical Guide Design",
    description: "Implant planning from CBCT + intraoral scan data. STL guide for in-house printing. All major implant systems.",
    specialist: "Implantologist",
    iconSrc: surgicalIcon,
    href: "/services/surgical-guide",
  },
  {
    title: "Crown & Bridge Design",
    description: "Full contour CAD restoration from intraoral scans. Crowns, bridges, veneers, inlays, onlays. Per-unit pricing.",
    specialist: "Qualified Dentist",
    iconSrc: crownIcon,
    href: "/services/crown-bridge",
  },
  {
    title: "CBCT Reporting",
    description: "Full pathology review by oral & maxillofacial radiologists. Standard and premium implant-site reports. Arabic + English.",
    specialist: "OMF Radiologist",
    iconSrc: cbctIcon,
    href: "/services/cbct-reporting",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Index = () => {
  const [consultationOpen, setConsultationOpen] = useState(false);

  return (
    <div>
      <BookConsultationModal open={consultationOpen} onOpenChange={setConsultationOpen} />
      {/* HERO */}
      <section className="relative overflow-hidden py-24 lg:py-36" style={{ backgroundColor: "#0D1B2E" }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ConstellationSphere size={800} opacity={0.12} />
        </div>
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block bg-hdi-navy/80 text-hdi-sky text-[9px] tracking-[3px] uppercase font-sans px-4 py-1.5 rounded-full border border-hdi-border/20 mb-8">
              Healthcare Digital Intelligence
            </span>
            <h1 className="text-hdi-off-white max-w-3xl mx-auto" style={{ fontWeight: 800, lineHeight: 1.05, letterSpacing: "-1px" }}>
              Where healthcare meets{" "}
              <em style={{ fontStyle: "italic", color: "#5DCAA5", fontWeight: 700 }}>
                intelligence
              </em>
            </h1>
            <p className="font-sans uppercase mt-6" style={{ color: "#5A7A92", letterSpacing: "3px", fontSize: "14px", fontWeight: 600 }}>
              Specialists hand in hand with you
            </p>
            <p className="font-sans mt-8" style={{ color: "#5DCAA5", fontSize: "17px", fontWeight: 500 }}>
              ✦ One free trial case per category — no commitment required
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link
                to="/register"
                className="text-primary-foreground px-8 py-3 rounded-lg font-sans transition-colors"
                style={{ backgroundColor: "#1D9E75", fontSize: "17px", fontWeight: 700 }}
              >
                Start a free trial
              </Link>
              <button
                onClick={() => setConsultationOpen(true)}
                className="border border-hdi-border/30 text-hdi-off-white hover:bg-hdi-navy/50 px-8 py-3 rounded-lg font-sans transition-colors"
                style={{ fontSize: "17px", fontWeight: 600 }}
              >
                Book a consultation
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ backgroundColor: "#FFFFFF" }} className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <p className="uppercase mb-[10px]" style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "3px", color: "#1D9E75" }}>
            Dental Services — Active Now
          </p>
          <h2 className="mb-6" style={{ color: "#0D1B2E", fontWeight: 700, letterSpacing: "-0.5px" }}>
            Every case. A qualified specialist.
          </h2>

          {/* Free Trial Banner — pill style */}
          <div
            className="inline-flex items-center gap-2 mb-11"
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
              <strong>One free trial per category</strong> — new accounts receive one complimentary case in each service category
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
              >
                <Link
                  to={s.href}
                  className="relative block rounded-lg p-6 hover:shadow-lg transition-shadow group"
                  style={{
                    border: s.accent ? "1px solid rgba(29,158,117,0.30)" : "1px solid #D0E4F0",
                    backgroundColor: s.accent ? "#F2FBF8" : "#FFFFFF",
                  }}
                >
                  {/* Icon */}
                  <div
                    className="mb-4 flex-shrink-0 flex items-center justify-center"
                    style={{
                      width: "54px",
                      height: "54px",
                      border: s.accent ? "1px solid #9FE1CB" : "1px solid #D0E4F0",
                      borderRadius: "8px",
                      backgroundColor: s.accent ? "#EAF9F3" : "#F8FAFB",
                    }}
                  >
                    <img src={s.iconSrc} alt={s.title} style={{ width: "42px", height: "42px", objectFit: "contain" }} />
                  </div>

                  {/* Title */}
                  <h3 className="font-serif mb-1" style={{ fontSize: "15px", fontWeight: 600, color: "#0D1B2E" }}>
                    {s.title}
                  </h3>

                  {/* Description */}
                  <p className="font-sans mb-3" style={{ fontSize: "12px", color: "#5A7A92", lineHeight: 1.68 }}>
                    {s.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="font-sans bg-accent/20 text-accent px-2.5 py-0.5 rounded-full font-medium" style={{ fontSize: "11px" }}>
                      {s.specialist}
                    </span>
                    <span className="font-sans bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium" style={{ fontSize: "11px" }}>
                      Clinical meeting available
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Expanding into Healthcare */}
          <p className="font-sans uppercase mt-16 mb-6" style={{ fontSize: "9px", letterSpacing: "3px", color: "#1D9E75" }}>
            Expanding Into Healthcare
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Medical Radiology - Active */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
            >
              <Link
                to="/services/medical-radiology"
                className="relative block rounded-lg p-6 hover:shadow-lg transition-shadow"
                style={{ border: "1px solid #D0E4F0", backgroundColor: "#FFFFFF" }}
              >
                <div className="mb-4 flex items-center justify-center" style={{ width: "54px", height: "54px", border: "1px solid #D0E4F0", borderRadius: "8px", backgroundColor: "#F8FAFB" }}>
                  <img src={medicalIcon} alt="Medical Radiology Reporting" style={{ width: "42px", height: "42px", objectFit: "contain" }} />
                </div>
                <h3 className="font-serif mb-1" style={{ fontSize: "15px", fontWeight: 600, color: "#0D1B2E" }}>
                  Medical Radiology Reporting
                </h3>
                <p className="font-sans mb-3" style={{ fontSize: "12px", color: "#5A7A92", lineHeight: 1.68 }}>
                  Remote CT, MRI and X-ray interpretation by board-certified radiologists for private clinics and polyclinics.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="font-sans bg-accent/20 text-accent px-2.5 py-0.5 rounded-full font-medium" style={{ fontSize: "11px" }}>
                    Board-certified radiologist
                  </span>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
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
                <h3 className="font-serif mb-1" style={{ fontSize: "15px", fontWeight: 600, color: "#8AACBF" }}>
                  Dermatology Telediagnosis
                </h3>
                <p className="font-sans" style={{ fontSize: "12px", color: "#9ABACC", lineHeight: 1.68 }}>
                  Remote dermatological assessment and diagnosis support — coming soon to the HDI platform.
                </p>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="relative py-20 lg:py-28 overflow-hidden" style={{ backgroundColor: "#0D1B2E" }}>
        <div className="absolute top-0 right-0 pointer-events-none" style={{ opacity: 0.07, width: 260 }}>
          <img src="/hdi-sphere.svg" alt="" width={260} height={260} />
        </div>
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {[
              { num: "01", title: "Specialists, not technicians", desc: "Every case is handled by a licensed healthcare specialist — not a lab tech." },
              { num: "02", title: "Clinical meetings on every case", desc: "Optional face-to-face video consultation with your assigned specialist." },
              { num: "03", title: "48-hour guaranteed delivery", desc: "Standard turnaround on all services. Rush 24-hour option available." },
              { num: "04", title: "Try before you commit", desc: "One free trial case per service category — no credit card required." },
            ].map((item, idx) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: parseInt(item.num) * 0.1 }}
                style={{
                  padding: "36px 24px",
                  borderRight: idx < 3 ? "1px solid rgba(122,174,207,0.07)" : "none",
                }}
              >
                <span className="block font-sans mb-4" style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "2px", color: "#5DCAA5", opacity: 0.5 }}>{item.num}</span>
                <h3 className="font-sans mb-[10px]" style={{ fontSize: "22px", fontWeight: 700, color: "white", lineHeight: 1.3 }}>{item.title}</h3>
                <p className="font-sans" style={{ fontSize: "16px", fontWeight: 400, color: "rgba(240,242,245,0.8)", lineHeight: 1.7 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="py-20 lg:py-28" style={{ backgroundColor: "#F5F8FC" }}>
        <div className="container mx-auto px-4 lg:px-8">
          <p className="font-sans uppercase mb-[10px]" style={{ fontSize: "9px", letterSpacing: "3px", color: "#1D9E75" }}>
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-light mb-14" style={{ color: "#0D1B2E" }}>
            From scan to delivery in 4 steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[22px] left-[12.5%] right-[12.5%] h-px" style={{ backgroundColor: "#D0E4F0" }} />
            {[
              { step: "1", title: "Register", desc: "Create your free account and unlock one complimentary trial case per service." },
              { step: "2", title: "Submit your case", desc: "Upload scan files, CBCT or imaging through your secure dashboard." },
              { step: "3", title: "Specialist designs", desc: "Your specialist reviews, designs, and optionally meets you online." },
              { step: "4", title: "Download & use", desc: "Receive STL files or your report. Print in-house or forward to lab." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
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
                  {item.step}
                </div>
                <h3 className="font-sans font-semibold mb-2" style={{ fontSize: "13px", color: "#0D1B2E" }}>
                  {item.title}
                </h3>
                <p className="font-sans" style={{ fontSize: "11px", color: "#5A7A92", lineHeight: 1.68 }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CONSULTATIONS */}
      <section id="specialists" className="py-20 lg:py-28" style={{ backgroundColor: "#162E45" }}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="font-sans uppercase mb-[10px]" style={{ fontSize: "9px", letterSpacing: "3px", color: "#1D9E75" }}>
                Clinical Consultations
              </p>
              <h2 className="font-serif mb-6" style={{ fontSize: "26px", fontWeight: 400, color: "white", lineHeight: 1.3 }}>
                Your specialist is available to meet — not just deliver a file.
              </h2>
              <p className="font-sans mb-7" style={{ fontSize: "13px", color: "rgba(240,242,245,0.44)", lineHeight: 1.75 }}>
                On every HDI service, request an online clinical consultation with the specialist on your case. Review the treatment plan together, clarify clinical questions, and confirm before the final design is released.
              </p>
              <button
                onClick={() => setConsultationOpen(true)}
                className="inline-block text-white px-8 py-3 rounded-lg font-medium font-sans transition-colors hover:opacity-90"
                style={{ backgroundColor: "#1D9E75" }}
              >
                Book a consultation →
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "ALIGNER CASES", text: "Online meeting with your orthodontist" },
                { label: "SURGICAL GUIDES", text: "Online meeting with your implantologist" },
                { label: "CROWN & BRIDGE", text: "Online meeting with a qualified dentist" },
                { label: "CBCT & RADIOLOGY REPORTS", text: "Direct radiologist access for clarifications" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-3 rounded-md"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(122,174,207,0.10)",
                    borderRadius: "6px",
                    padding: "14px 16px",
                  }}
                >
                  <div className="flex-shrink-0 mt-1" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#5DCAA5" }} />
                  <div>
                    <span className="block font-sans uppercase" style={{ fontSize: "9px", letterSpacing: "1.5px", color: "#5DCAA5" }}>
                      {row.label}
                    </span>
                    <span className="block font-sans mt-1" style={{ fontSize: "12px", color: "rgba(240,242,245,0.65)" }}>
                      {row.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
