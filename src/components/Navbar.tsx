import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, LayoutDashboard, Plus, UserCircle, LogOut } from "lucide-react";
import { useAuth, getLoginRedirect } from "@/contexts/AuthContext";
import HdiLogo from "./HdiLogo";

const navLinks = [
  { label: "HDI Studio", href: "/services" },
  { label: "HDI OS", href: "/hdi-os" },
  { label: "About", href: "/about" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading, roles, defaultRole, isClient } = useAuth();

  // Where the "Dashboard" link should send the current user.
  const dashboardPath = user ? getLoginRedirect(roles, defaultRole) : "/dashboard";

  const handleSubmitCase = () => {
    if (user) {
      // Only clients have a "submit case" flow inside /dashboard.
      if (isClient) navigate("/dashboard/submit");
      else navigate(dashboardPath);
    } else {
      navigate("/register");
    }
  };

  const getInitials = () => {
    const email = user?.email || "";
    return email.charAt(0).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-sm border-b border-hdi-border/10" style={{ backgroundColor: "#07111D" }}>
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-[14px]">
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

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-hdi-sky/80 hover:text-hdi-off-white font-sans transition-colors"
              style={{ fontSize: "15px", fontWeight: 500 }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          {!loading && !user && (
            <Link to="/login" className="text-hdi-sky/80 hover:text-hdi-off-white text-sm font-sans transition-colors">
              Sign in
            </Link>
          )}

          {!loading && user && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 text-hdi-sky/80 hover:text-hdi-off-white text-sm font-sans transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  {getInitials()}
                </div>
                <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                    <Link
                      to={dashboardPath}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-foreground hover:bg-muted transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    {isClient && (
                      <>
                        <Link
                          to="/dashboard/submit"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-foreground hover:bg-muted transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Plus size={14} /> Submit Case
                        </Link>
                        <Link
                          to="/dashboard/profile"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-foreground hover:bg-muted transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <UserCircle size={14} /> Profile
                        </Link>
                      </>
                    )}
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { setDropdownOpen(false); signOut(); }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-sans text-destructive hover:bg-muted transition-colors w-full text-left"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleSubmitCase}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-lg font-sans transition-colors whitespace-nowrap"
            style={{ fontSize: "15px", fontWeight: 700 }}
          >
            Submit a case
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-hdi-off-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-hdi-navy border-t border-hdi-border/10 px-4 py-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="block text-hdi-sky/80 hover:text-hdi-off-white font-sans"
              style={{ fontSize: "16px", fontWeight: 500 }}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-hdi-border/10 space-y-3">
            {!loading && !user && (
              <Link to="/login" className="block text-hdi-sky/80 font-sans" style={{ fontSize: "16px", fontWeight: 500 }} onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
            )}
            {!loading && user && (
              <>
                <Link to={dashboardPath} className="block text-hdi-sky/80 font-sans" style={{ fontSize: "16px", fontWeight: 500 }} onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
                {isClient && (
                  <Link to="/dashboard/profile" className="block text-hdi-sky/80 font-sans" style={{ fontSize: "16px", fontWeight: 500 }} onClick={() => setMobileOpen(false)}>
                    Profile
                  </Link>
                )}
                <button onClick={() => { setMobileOpen(false); signOut(); }} className="block text-destructive font-sans" style={{ fontSize: "16px", fontWeight: 500 }}>
                  Sign out
                </button>
              </>
            )}
            <button
              onClick={() => { setMobileOpen(false); handleSubmitCase(); }}
              className="block w-full bg-primary text-primary-foreground px-5 py-3 rounded-lg font-sans text-center whitespace-nowrap"
              style={{ fontSize: "16px", fontWeight: 700 }}
            >
              Submit a case
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
