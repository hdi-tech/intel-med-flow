const Disclaimer = () => (
  <div>
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#0D1B2E" }}>
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-light text-hdi-off-white">Medical Disclaimer</h1>
        <p className="font-sans text-sm mt-4" style={{ color: "#7AAECC" }}>Last updated: April 2026</p>
      </div>
    </section>
    <section className="py-16 lg:py-20" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl font-sans text-sm leading-[1.85] space-y-6" style={{ color: "#3A5A70" }}>
        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>Professional Use Only</h2>
        <p>The HDI Connect platform and all services provided through it are intended exclusively for use by licensed healthcare professionals, dental practitioners, clinics, and dental laboratories. The Platform is not intended for use by patients or the general public.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>Not a Substitute for Clinical Judgement</h2>
        <p>All digital designs, radiological reports, surgical guides, aligner plans, and other deliverables produced by HDI are intended as clinical planning tools only. They do not constitute medical advice, clinical diagnosis, or treatment recommendations. The treating clinician retains full and sole responsibility for all clinical decisions, treatment planning, and patient outcomes.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>Verification Responsibility</h2>
        <p>It is the responsibility of the ordering clinician to review, verify, and validate all deliverables received through the Platform before clinical implementation. This includes but is not limited to: verifying design accuracy against clinical requirements; confirming implant positions and angulations against patient anatomy; reviewing radiological reports in the context of the patient's complete clinical history; checking fit, margins, and occlusion of all prosthetic designs.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>No Warranty of Outcomes</h2>
        <p>HDI does not warrant or guarantee any specific clinical outcome resulting from the use of its deliverables. Clinical outcomes depend on multiple factors including but not limited to: the clinician's skill and experience, patient compliance, material selection, manufacturing processes, and clinical conditions at the time of treatment.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>Limitation of Liability</h2>
        <p>To the maximum extent permitted by UAE law, Healthcare Digital Intelligence, its specialists, designers, and affiliates shall not be held liable for any adverse clinical outcomes, patient injuries, or damages arising from the use or misuse of deliverables produced through the Platform.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>Regulatory Compliance</h2>
        <p>HDI operates as a digital services provider and does not manufacture medical devices. Clinicians are responsible for ensuring that any physical products manufactured from HDI digital designs comply with the relevant medical device regulations in their jurisdiction.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>Data Accuracy</h2>
        <p>The accuracy of HDI deliverables depends on the quality and completeness of the clinical data submitted. HDI is not responsible for inaccuracies resulting from poor-quality scans, incomplete data submissions, or incorrect clinical information provided by the client.</p>

        <p className="text-xs text-muted-foreground pt-8">For questions about this disclaimer, contact us at <a href="mailto:info@hdi-tech.com" className="text-primary hover:underline">info@hdi-tech.com</a>.</p>
      </div>
    </section>
  </div>
);

export default Disclaimer;
