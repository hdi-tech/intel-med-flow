import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HdiLogo from "./HdiLogo";
import RoleSwitcher from "./RoleSwitcher";
import RoleAccentBar from "./RoleAccentBar";
import { LayoutDashboard, FolderOpen, Plus, LogOut, Menu, X, UserCircle, CalendarCheck, MessageSquare } from "lucide-react";
import { useState } from "react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Cases", href: "/dashboard/cases", icon: FolderOpen },
    { label: "Consultations", href: "/dashboard/consultations", icon: CalendarCheck },
    { label: "Submit Case", href: "/dashboard/submit", icon: Plus },
    { label: "Profile", href: "/dashboard/profile", icon: UserCircle },
    { label: "Give Feedback", href: "/feedback", icon: MessageSquare },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F8FC" }}>
      <RoleAccentBar />
      {/* Dark navbar */}
      <nav className="sticky top-0 z-50 border-b border-hdi-border/10" style={{ backgroundColor: "#07111D" }}>
        <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-[14px]">
            <div className="w-[44px] h-[44px] flex-shrink-0">
              <HdiLogo size={44} />
            </div>
            <span
              style={{
                fontFamily: "'Fugaz One', cursive",
                fontWeight: 400,
                fontSize: "22px",
                letterSpacing: "0.08em",
                color: "#F0F2F5",
              }}
            >
              H D I
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 text-sm font-sans transition-colors ${
                  isActive(item.href)
                    ? "text-hdi-off-white"
                    : "text-hdi-sky/70 hover:text-hdi-off-white"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <RoleSwitcher />
            <Link to="/" className="text-hdi-sky/70 hover:text-hdi-off-white text-sm font-sans transition-colors">
              Home
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-hdi-sky/70 hover:text-hdi-off-white text-sm font-sans transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>

          <button className="md:hidden text-hdi-off-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-hdi-border/10 px-4 py-4 space-y-3" style={{ backgroundColor: "#07111D" }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center gap-2 text-hdi-sky/80 hover:text-hdi-off-white text-sm font-sans"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-hdi-border/10">
              <button onClick={signOut} className="flex items-center gap-1 text-hdi-sky/70 text-sm font-sans">
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="container mx-auto px-4 lg:px-8 py-8">{children}</main>
    </div>
  );
};

export default DashboardLayout;
