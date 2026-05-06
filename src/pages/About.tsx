import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import ConstellationSphere from "@/components/ConstellationSphere";

const values = [
  { num: "01", title: "Specialist-led", desc: "Every case handled by a credentialled peer, not a technician." },
  { num: "02", title: "Clinically intelligent", desc: "We build tools that understand the clinical context behind every file." },
  { num: "03", title: "Education-first", desc: "We equip professionals with knowledge, not just deliverables." },
];

const About = () => (
  <div>
    {/* Hero */}
    <section className="relative overflow-hidden py-24 lg:py-32" style={{ backgroundColor: "#0D1B2E" }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <ConstellationSphere size={800} opacity={0.1} />
      </div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-block font-sans text-[9px] tracking-[3px] uppercase px-4 py-1.5 rounded-full border mb-8" style={{ color: "#5DCAA5", borderColor: "rgba(93,202,165,0.25)", backgroundColor: "rgba(22,46,69,0.6)" }}>
            About HDI
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-hdi-off-white leading-tight max-w-3xl mx-auto">
            Where healthcare meets{" "}
            <em className="not-italic" style={{ fontStyle: "italic", color: "#5DCAA5" }}>intelligence</em>
          </h1>
        </motion.div>
      </div>
    </section>

    {/* About text */}
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="font-sans text-sm leading-[1.85] space-y-6" style={{ color: "#3A5A70" }}>
            <p>
              HDI is a digital destination for healthcare professionals who believe their patients deserve better — better planning, better precision, better outcomes.
            </p>
            <p>
              Healthcare Digital Intelligence connects clinical professionals with specialist-reviewed digital services across dentistry and medicine. We don't use technicians. Every case is handled by a credentialled specialist in your exact discipline — someone who understands not just the file, but the clinical decision behind it.
            </p>
            <p>
              Our mission is to make world-class digital healthcare accessible to every practitioner, regardless of geography. We are building a platform where workflows are intelligent, outcomes are measurable, and professionals never stop learning.
            </p>
            <p>
              That is why HDI invests beyond delivery. Our clinical education programme equips every practitioner with the knowledge to review, validate, and elevate the results they receive — because a great design is only as good as the clinician who implements it.
            </p>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Values */}
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#0D1B2E" }}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {values.map((v, idx) => (
            <motion.div
              key={v.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12 }}
              className="p-8 md:p-10"
              style={{ borderRight: idx < 2 ? "1px solid rgba(122,174,207,0.07)" : "none" }}
            >
              <span className="block font-sans text-[9px] tracking-[3px] mb-4" style={{ color: "#5DCAA5", opacity: 0.65 }}>{v.num}</span>
              <h3 className="font-sans font-semibold text-sm text-hdi-off-white mb-2">{v.title}</h3>
              <p className="font-sans text-xs" style={{ color: "rgba(240,242,245,0.4)", lineHeight: 1.7 }}>{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Specialists */}
    <section id="specialists" className="py-20 lg:py-28" style={{ backgroundColor: "#F5F8FC" }}>
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <span className="inline-block font-sans text-[9px] tracking-[3px] uppercase px-4 py-1.5 rounded-full border mb-6" style={{ color: "#1D9E75", borderColor: "rgba(29,158,117,0.25)", backgroundColor: "rgba(29,158,117,0.06)" }}>
            Our Specialists
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-light mb-4" style={{ color: "#0D1B2E" }}>
            Every case. A specialist behind it.
          </h2>
          <p className="font-sans text-sm mb-10" style={{ color: "#5A7A92", lineHeight: 1.7, maxWidth: "560px" }}>
            HDI does not use technicians. Every case is handled by a credentialled specialist in the relevant discipline — someone who understands the clinical context, not just the file.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Prosthodontists & Restorative Specialists", desc: "Crown, bridge, and full-arch restoration design reviewed by specialists trained in fixed and removable prosthodontics." },
            { title: "Oral & Maxillofacial Radiologists", desc: "CBCT reports and segmentation analysis authored by qualified OMF radiologists with clinical reporting experience." },
            { title: "Implantologists & Surgical Planners", desc: "Surgical guide planning and implant positioning reviewed by practitioners experienced in guided surgery protocols." },
            { title: "Orthodontists & Aligner Designers", desc: "Clear aligner treatment plans created by orthodontic specialists with expertise in staged tooth movement design." },
          ].map((s, idx) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-lg p-6"
              style={{ border: "1px solid #D0E4F0", backgroundColor: "#FFFFFF" }}
            >
              <h3 className="font-serif font-semibold text-sm mb-2" style={{ color: "#0D1B2E" }}>{s.title}</h3>
              <p className="font-sans text-xs" style={{ color: "#5A7A92", lineHeight: 1.7 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Education teaser */}
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#162E45" }}>
      <div className="container mx-auto px-4 lg:px-8 text-center max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="inline-block font-sans text-[9px] tracking-[3px] uppercase px-4 py-1.5 rounded-full border mb-8" style={{ color: "#FCD34D", borderColor: "rgba(252,211,77,0.25)", backgroundColor: "rgba(252,211,77,0.08)" }}>
            Coming Soon
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-light text-hdi-off-white mb-4">
            HDI Clinical Education
          </h2>
          <p className="font-sans text-sm mb-10" style={{ color: "#7AAECC", lineHeight: 1.7 }}>
            Structured clinical courses designed to help practitioners review, validate, and implement digital designs with confidence. Launching soon.
          </p>
          <Link
            to="/contact"
            className="inline-block border px-8 py-3 rounded-lg font-medium font-sans text-sm transition-colors hover:bg-hdi-off-white/5"
            style={{ borderColor: "rgba(240,242,245,0.2)", color: "#F0F2F5" }}
          >
            Join the waitlist
          </Link>
        </motion.div>
      </div>
    </section>
  </div>
);

export default About;
