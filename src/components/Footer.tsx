import { Link } from "react-router-dom";
import HdiLogo from "./HdiLogo";

const Footer = () => (
  <footer className="bg-hdi-footer text-hdi-sky/60">
    <div className="container mx-auto px-4 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[32px] h-[32px] flex-shrink-0">
              <HdiLogo size={32} borderRadius={4} />
            </div>
            <span
              style={{
                fontFamily: "'Fugaz One', cursive",
                fontWeight: 400,
                fontSize: "17px",
                letterSpacing: "0.08em",
                color: "#F0F2F5",
              }}
            >
              H D I
            </span>
          </div>
          <p className="text-sm leading-relaxed max-w-sm font-sans">
            Specialist-driven digital services for dentistry and healthcare. Every case reviewed by a qualified professional.
          </p>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-hdi-off-white font-serif text-sm font-semibold mb-4">Services</h4>
          <ul className="space-y-2 text-sm font-sans">
            <li><Link to="/services#aligners" className="hover:text-hdi-teal-light transition-colors">Clear Aligners</Link></li>
            <li><Link to="/services#surgical" className="hover:text-hdi-teal-light transition-colors">Surgical Guides</Link></li>
            <li><Link to="/services#crown" className="hover:text-hdi-teal-light transition-colors">Crown & Bridge</Link></li>
            <li><Link to="/services#cbct" className="hover:text-hdi-teal-light transition-colors">CBCT Reports</Link></li>
            <li><Link to="/services#dsd" className="hover:text-hdi-teal-light transition-colors">Digital Smile Design</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-hdi-off-white font-serif text-sm font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm font-sans">
            <li><Link to="/about" className="hover:text-hdi-teal-light transition-colors">About HDI</Link></li>
            <li><Link to="/pricing" className="hover:text-hdi-teal-light transition-colors">Pricing</Link></li>
            <li><Link to="/register" className="hover:text-hdi-teal-light transition-colors">Free Trial</Link></li>
            <li><Link to="/contact" className="hover:text-hdi-teal-light transition-colors">Contact</Link></li>
            <li><Link to="/education" className="hover:text-hdi-teal-light transition-colors">Education <span className="text-[10px] text-hdi-sky/40 ml-1">coming soon</span></Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-hdi-border/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-sans">
        <p>© 2026 Healthcare Digital Intelligence</p>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <Link to="/terms" className="hover:text-hdi-teal-light transition-colors">Terms</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-hdi-teal-light transition-colors">Privacy</Link>
          <span>·</span>
          <Link to="/disclaimer" className="hover:text-hdi-teal-light transition-colors">Disclaimer</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
