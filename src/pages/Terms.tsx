import { Link } from "react-router-dom";

const Terms = () => (
  <div>
    <section className="py-20 lg:py-28" style={{ backgroundColor: "#0D1B2E" }}>
      <div className="container mx-auto px-4 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-light text-hdi-off-white">Terms of Service</h1>
        <p className="font-sans text-sm mt-4" style={{ color: "#7AAECC" }}>Last updated: April 2026</p>
      </div>
    </section>
    <section className="py-16 lg:py-20" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl font-sans text-sm leading-[1.85] space-y-6" style={{ color: "#3A5A70" }}>
        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>1. Agreement to Terms</h2>
        <p>By accessing or using the HDI Connect platform ("Platform"), operated by Healthcare Digital Intelligence ("HDI", "we", "us"), registered in the United Arab Emirates, you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>2. Description of Service</h2>
        <p>HDI Connect is a business-to-business digital services platform connecting licensed dental and healthcare professionals with specialist-reviewed digital design, radiological reporting, and clinical planning services. Services include but are not limited to crown and bridge design, surgical guide planning, CBCT analysis, clear aligner design, and digital smile design.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>3. Eligibility</h2>
        <p>The Platform is intended for use by licensed healthcare professionals, dental practitioners, clinics, and laboratories. By registering, you represent that you hold a valid professional licence in your jurisdiction and that the information provided during registration is accurate and complete.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>4. Account Responsibilities</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You must not share your account with others. You are responsible for all activity that occurs under your account. You must notify HDI immediately of any unauthorised use.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>5. Case Submission and Delivery</h2>
        <p>Cases submitted through the Platform are reviewed by qualified specialists. Standard delivery is within 48 business hours; rush delivery is within 24 hours, subject to availability. HDI reserves the right to request additional clinical information before proceeding with a case. Delivery timelines begin upon receipt of all required files and, where applicable, confirmed payment.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>6. Pricing and Payment</h2>
        <p>Service pricing is displayed in AED (UAE Dirham). Payment must be completed before case delivery unless the case qualifies for a free trial. HDI accepts bank transfer and card payments. Custom-quoted services will have pricing confirmed by the HDI team before work begins. All payments are non-refundable once design work has commenced.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>7. Free Trial</h2>
        <p>New users are entitled to one complimentary trial case per service category. Free trial cases are subject to standard review and delivery timelines. HDI reserves the right to modify or discontinue the free trial programme at any time.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>8. Intellectual Property</h2>
        <p>All design files, reports, and deliverables produced by HDI remain the intellectual property of HDI until full payment is received. Upon payment, the client receives a non-exclusive licence to use the deliverables for the specific patient case submitted. Redistribution, resale, or use for training purposes without written consent is prohibited.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>9. Clinical Responsibility</h2>
        <p>HDI provides digital design and reporting services only. The treating clinician retains full clinical responsibility for all treatment decisions, patient outcomes, and the implementation of any designs or reports received through the Platform. HDI deliverables are intended as planning aids and do not constitute clinical advice or diagnosis.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>10. Data Protection</h2>
        <p>HDI processes data in accordance with its <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>. By using the Platform, you consent to the collection, processing, and storage of data as described therein. All patient data must be de-identified before submission. HDI is not responsible for data submitted with identifiable patient information.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>11. Limitation of Liability</h2>
        <p>To the maximum extent permitted by UAE law, HDI shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of the Platform or its deliverables. HDI's total liability shall not exceed the amount paid by the client for the specific case in question.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>12. Termination</h2>
        <p>HDI reserves the right to suspend or terminate any account that violates these Terms, submits fraudulent information, or engages in behaviour detrimental to the Platform or its users. Users may request account deactivation at any time by contacting support.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>13. Governing Law</h2>
        <p>These Terms are governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of the UAE.</p>

        <h2 className="text-xl font-serif font-semibold" style={{ color: "#0D1B2E" }}>14. Changes to Terms</h2>
        <p>HDI reserves the right to update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised Terms. Users will be notified of material changes via email.</p>

        <p className="text-xs text-muted-foreground pt-8">For questions about these Terms, contact us at <a href="mailto:info@hdi-tech.com" className="text-primary hover:underline">info@hdi-tech.com</a>.</p>
      </div>
    </section>
  </div>
);

export default Terms;
