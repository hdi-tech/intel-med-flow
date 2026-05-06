import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HdiLogo from "./HdiLogo";
import RoleSwitcher from "./RoleSwitcher";
import RoleAccentBar from "./RoleAccentBar";
import { LayoutDashboard, LogOut, Home, Menu, X, CalendarCheck, MessageSquare } from "lucide-react";
import { useState } from "react";

const DesignerLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F8FC" }}>
      <RoleAccentBar />
      <nav className="sticky top-0 z-50 border-b border-hdi-border/10" style={{ backgroundColor: "#07111D" }}>
        <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <Link to="/designer" className="flex items-center gap-[14px]">
            <div className="w-[44px] h-[44px] shrink-0"><HdiLogo size={44} /></div>
            <span style={{ fontFamily: "'Fugaz One', cursive", fontWeight: 400, fontSize: "22px", letterSpacing: "0.08em", color: "#F0F2F5" }}>H D I</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/designer" className={`flex items-center gap-2 text-sm font-sans transition-colors ${location.pathname === "/designer" ? "text-hdi-off-white" : "text-hdi-sky/70 hover:text-hdi-off-white"}`}>
              <LayoutDashboard size={16} /> My Queue
            </Link>
            <Link to="/designer/consultations" className={`flex items-center gap-2 text-sm font-sans transition-colors ${location.pathname === "/designer/consultations" ? "text-hdi-off-white" : "text-hdi-sky/70 hover:text-hdi-off-white"}`}>
              <CalendarCheck size={16} /> Consultations
            </Link>
            <Link to="/feedback" className={`flex items-center gap-2 text-sm font-sans transition-colors ${location.pathname === "/feedback" ? "text-hdi-off-white" : "text-hdi-sky/70 hover:text-hdi-off-white"}`}>
              <MessageSquare size={16} /> Give Feedback
            </Link>
            <Link to="/" className="text-hdi-sky/70 hover:text-hdi-off-white text-sm font-sans transition-colors flex items-center gap-2">
              <Home size={16} /> Home
            </Link>
            <RoleSwitcher />
            <button onClick={signOut} className="flex items-center gap-1 text-hdi-sky/70 hover:text-hdi-off-white text-sm font-sans transition-colors">
              <LogOut size={14} /> Sign out
            </button>
          </div>

          <button className="md:hidden text-hdi-off-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-hdi-border/10 px-4 py-4 space-y-3" style={{ backgroundColor: "#07111D" }}>
            <Link to="/designer" className="flex items-center gap-2 text-hdi-sky/80 text-sm font-sans" onClick={() => setMobileOpen(false)}>
              <LayoutDashboard size={16} /> My Queue
            </Link>
            <Link to="/designer/consultations" className="flex items-center gap-2 text-hdi-sky/80 text-sm font-sans" onClick={() => setMobileOpen(false)}>
              <CalendarCheck size={16} /> Consultations
            </Link>
            <Link to="/feedback" className="flex items-center gap-2 text-hdi-sky/80 text-sm font-sans" onClick={() => setMobileOpen(false)}>
              <MessageSquare size={16} /> Give Feedback
            </Link>
            <button onClick={signOut} className="flex items-center gap-1 text-hdi-sky/70 text-sm font-sans">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </nav>

      <main className="container mx-auto px-4 lg:px-8 py-8">{children}</main>
    </div>
  );
};

export default DesignerLayout;
