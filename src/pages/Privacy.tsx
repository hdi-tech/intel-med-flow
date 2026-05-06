const Privacy = () => (
  <div>
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#0D1B2E" }}>
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-light text-hdi-off-white">Privacy Policy</h1>
        <p className="font-sans text-sm mt-4" style={{ color: "#7AAECC" }}>Last updated: April 2026</p>
      </div>
    </section>
    <section className="py-16 lg:py-20" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl font-sans text-sm leading-[1.85] space-y-6" style={{ color: "#3A5A70" }}>
        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>1. Introduction</h2>
        <p>Healthcare Digital Intelligence ("HDI", "we", "us"), registered in the United Arab Emirates, is committed to protecting the privacy of healthcare professionals and their patients. This Privacy Policy explains how we collect, use, store, and protect information submitted through the HDI Connect platform ("Platform").</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>2. Information We Collect</h2>
        <p><strong>Account Information:</strong> Full name, email address, clinic name, country, and professional specialty provided during registration.</p>
        <p><strong>Case Data:</strong> Clinical notes, patient reference identifiers, intraoral scans (STL files), radiographic data (DICOM files), photographs, and other files submitted for case processing. All patient data must be de-identified before submission.</p>
        <p><strong>Payment Information:</strong> Transaction records, payment references, and bank transfer confirmations. Card payments are processed through Stripe; HDI does not store card numbers.</p>
        <p><strong>Usage Data:</strong> Login timestamps, IP addresses, browser type, and platform interaction data collected automatically for security and analytics purposes.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>3. How We Use Your Information</h2>
        <p>We use the information collected to: process and deliver digital design and reporting services; communicate case updates and platform notifications; verify payments; improve platform functionality; comply with legal obligations under UAE law.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>4. Data Storage and Security</h2>
        <p>All data is stored on secure, encrypted cloud infrastructure. Case files are stored in private, access-controlled storage buckets. Access to patient-related data is restricted to authorised HDI specialists assigned to the specific case. We employ industry-standard security measures including encryption in transit and at rest, role-based access controls, and regular security audits.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>5. Data Sharing</h2>
        <p>HDI does not sell, rent, or trade your personal information to third parties. Case data may be shared with: assigned HDI design specialists (for case processing only); payment processors (Stripe) for transaction processing; cloud infrastructure providers for hosting and storage. All third-party providers are bound by confidentiality agreements.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>6. Patient Data Responsibility</h2>
        <p>Clients are solely responsible for ensuring all patient data submitted to the Platform is de-identified in accordance with applicable data protection regulations in their jurisdiction. HDI does not accept responsibility for identifiable patient information submitted by clients. Patient reference fields should use anonymised identifiers only.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>7. Data Retention</h2>
        <p>Account information is retained for the duration of the account and for 12 months after account deactivation. Case files are retained for 24 months after case delivery for quality assurance and dispute resolution purposes. Payment records are retained as required by UAE financial regulations.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>8. Your Rights</h2>
        <p>You may request access to, correction of, or deletion of your personal data by contacting us at info@hdi-tech.com. Account deactivation requests can be submitted through your profile settings. We will respond to data requests within 30 business days.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>9. Cookies</h2>
        <p>The Platform uses essential cookies for authentication and session management. No third-party advertising cookies are used. Analytics cookies may be used to improve platform performance.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>10. Changes to This Policy</h2>
        <p>HDI reserves the right to update this Privacy Policy at any time. Users will be notified of material changes via email. Continued use of the Platform after changes constitutes acceptance.</p>

        <p className="text-xs text-muted-foreground pt-8">For privacy-related inquiries, contact us at <a href="mailto:info@hdi-tech.com" className="text-primary hover:underline">info@hdi-tech.com</a>.</p>
      </div>
    </section>
  </div>
);

export default Privacy;
